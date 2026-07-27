import urllib.request
url='https://developers.klaviyo.com/en/docs/trackers/website-tracking'
req=urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=30) as r:
    text=r.read().decode('utf-8','ignore')
    print(text[:20000])
