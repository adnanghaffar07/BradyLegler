import React, { useState, useEffect } from 'react';
import { set, unset, useFormValue } from 'sanity';
import { Box, Button, TextInput, Card, Flex, Stack, useToast } from '@sanity/ui';

const createPatchFrom = value => (value === '' ? unset() : set(value));

// Util function to check if URL is a valid YouTube or Vimeo URL
function isValidVideoUrl(url) {
  const youtubePattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/;
  const vimeoPattern = /^(https?:\/\/)?(www\.)?vimeo\.com\/\d+/;
  return youtubePattern.test(url) || vimeoPattern.test(url);
}

function VideoUrlInput({ type, value, onChange, path, elementProps, schemaType, ...rest }) {
  const { _id: documentId } = useFormValue([]);
  const toast = useToast();

  const thumbnailFieldKey = schemaType?.components?.options?.thumbnailField;
  const idSections = elementProps.id.split('.');
  const idSectionsExcludingLast = idSections.slice(0, -1);
  const idBase = idSectionsExcludingLast.join('.');
  const thumbnailField = `${idBase}.${thumbnailFieldKey}`;

  const generateThumbnail = async () => {
    try {
      let platform =
        value.includes('youtube.com') || value.includes('youtu.be')
          ? 'YouTube'
          : value.includes('vimeo.com')
            ? 'Vimeo'
            : 'Unknown';

      toast.push({
        status: 'info',
        title: `Fetching thumbnail from ${platform}. Please wait...`
      });

      let thumbnailUrl = '';
      let videoId;

      if (platform === 'YouTube') {
        if (value.includes('youtube.com')) {
          // Extracting video ID from long-form URLs
          videoId = value.split('v=')[1]?.split('&')[0];
        } else if (value.includes('youtu.be')) {
          // Extracting video ID from short-form URLs
          videoId = value.split('youtu.be/')[1]?.split('?')[0];
        }

        if (videoId) {
          thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }
      } else if (platform === 'Vimeo') {
        videoId = value.split('/').pop();
        const apiUrl = `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        thumbnailUrl = data.thumbnail_url.replace(/_295x166/, '_1600x');
      }

      if (thumbnailUrl && documentId && thumbnailField && videoId) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/sanity/save-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fileName: `${videoId}.jpg`, // The file name
            imageUrl: thumbnailUrl, // The video URL
            documentRef: documentId, // Provide the document ID where you want to save the thumbnail
            fieldName: thumbnailField // The field name in your document where the thumbnail should be saved
          })
        });

        if (!response.ok) {
          throw new Error('Failed to generate thumbnail');
        }

        const data = await response.json();

        toast.push({
          status: 'success',
          title: `Fetched thumbnail from ${platform}.`
        });
      }
    } catch (error) {
      toast.push({
        status: 'error',
        title: 'Failed to generate thumbnail',
        description: 'Try uploading it manually to the asset field instead.'
      });
    }
  };

  return (
    <Stack space={3}>
      <Flex direction="row" align="center" gap={3}>
        <Box flex={1} style={{ maxWidth: '100%' }}>
          <TextInput value={value} onChange={event => onChange(createPatchFrom(event.target.value))} {...rest} />
        </Box>
        <Button
          text="Generate Thumbnail"
          onClick={generateThumbnail}
          disabled={!isValidVideoUrl(value)}
          tone="primary"
        />
      </Flex>
    </Stack>
  );
}

export default VideoUrlInput;
