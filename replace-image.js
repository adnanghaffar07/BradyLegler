/* eslint-disable no-console */
import { createClient } from '@sanity/client'
/**
 * -----------------------------------------------------------------------------
 * Configuration
 * -----------------------------------------------------------------------------
 */
const projectId = '79j3g10q'
const dataset = 'production'
const token = 'skWLCJbMRUCfg2OOWemHMpxKqM2Ie5PFmoCdSsLbsC7721l0h0BvJfcuxCKHzSCRP1fEeLjFY3oncAuzrCVJVXtU8NEHYPTbOZxpHdnhAYh9EqHRIVUAG01JfnPtc6HuLCCE9d5jweBOBFskB3NX7eK0tCSK3HkJTc8deKbBpWindTs9o0BA'
const apiVersion = '2021-03-25'

// Safety switch:
// - true  => only log intended changes
// - false => commit updates to Sanity
const DRY_RUN = true

const client = createClient({
    projectId,
    dataset,
    token,
    apiVersion,
    useCdn: false,
})

const OLD_EXTENSIONS = new Set(['jpg', 'jpeg', 'png'])
const NEW_EXTENSION = 'webp'

function getFilenameBaseWithoutExtension(filename) {
    if (!filename || typeof filename !== 'string') return null

    const normalized = filename.trim()
    const lastDot = normalized.lastIndexOf('.')
    if (lastDot <= 0 || lastDot === normalized.length - 1) return null

    return normalized.slice(0, lastDot)
}

function getExtension(filename) {
    if (!filename || typeof filename !== 'string') return null

    const normalized = filename.trim()
    const lastDot = normalized.lastIndexOf('.')
    if (lastDot <= 0 || lastDot === normalized.length - 1) return null

    return normalized.slice(lastDot + 1).toLowerCase()
}

async function fetchImageAssets() {
    const query = `*[_type == "sanity.imageAsset"]{_id, originalFilename}`
    return client.fetch(query)
}

function buildAssetMapping(assets) {
    const groups = new Map()

    for (const asset of assets) {
        const filename = asset?.originalFilename
        const base = getFilenameBaseWithoutExtension(filename)
        const ext = getExtension(filename)
        if (!base || !ext) continue

        if (!groups.has(base)) {
            groups.set(base, [])
        }
        groups.get(base).push({ ...asset, ext, base })
    }

    const mapping = new Map()
    const skipped = []

    for (const [base, groupAssets] of groups.entries()) {
        const newAsset = groupAssets.find((a) => a.ext === NEW_EXTENSION)
        const oldAssets = groupAssets.filter((a) => OLD_EXTENSIONS.has(a.ext))

        if (!newAsset || oldAssets.length === 0) {
            skipped.push({
                base,
                reason: !newAsset ? 'No matching webp found' : 'No jpg/jpeg/png source found',
                filenames: groupAssets.map((a) => a.originalFilename),
            })
            continue
        }

        for (const oldAsset of oldAssets) {
            if (oldAsset._id !== newAsset._id) {
                mapping.set(oldAsset._id, newAsset._id)
            }
        }
    }

    return { mapping, skipped }
}

async function findReferencingDocuments(oldId) {
    const query = `*[_type != "sanity.imageAsset" && references($oldId)]{_id}`
    return client.fetch(query, { oldId })
}

async function replaceReferencesInDocument(docId, oldId, newId) {
    const path = `**[asset._ref=="${oldId}"].asset._ref`

    if (DRY_RUN) {
        console.log(`[DRY_RUN] Would patch ${docId}: ${oldId} -> ${newId}`)
        return
    }

    await client.patch(docId).replace({ [path]: newId }).commit()
    console.log(`[UPDATED] ${docId}: ${oldId} -> ${newId}`)
}

async function main() {
    try {
        console.log(`Starting image reference replacement... DRY_RUN=${DRY_RUN}`)

        const assets = await fetchImageAssets()
        console.log(`Fetched ${assets.length} image assets.`)

        const { mapping, skipped } = buildAssetMapping(assets)
        console.log(`Built ${mapping.size} old->webp mappings.`)

        let totalReplacements = 0

        for (const [oldId, newId] of mapping.entries()) {
            const docs = await findReferencingDocuments(oldId)

            if (!docs.length) {
                console.log(`[INFO] No docs reference ${oldId}.`)
                continue
            }

            for (const doc of docs) {
                await replaceReferencesInDocument(doc._id, oldId, newId)
                totalReplacements += 1
            }
        }

        console.log('-----------------------------------')
        console.log(`Total replacements ${DRY_RUN ? '(simulated)' : ''}: ${totalReplacements}`)
        console.log(`Skipped files/groups: ${skipped.length}`)
        if (skipped.length) {
            for (const item of skipped) {
                console.log(
                    `- ${item.base}: ${item.reason}. Files: ${item.filenames.join(', ')}`
                )
            }
        }
        console.log('Done.')
    } catch (error) {
        console.error('Script failed:', error?.message || error)
        process.exitCode = 1
    }
}

main()
