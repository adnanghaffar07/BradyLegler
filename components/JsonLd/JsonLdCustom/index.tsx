import React from 'react';

type JsonLdCustomProps = {
  jsonLd?: string | Record<string, any>;
};

const JsonLdCustom: React.FC<JsonLdCustomProps> = ({ jsonLd }) => {
  if (!jsonLd) {
    return null;
  }

  let jsonLdObject: any;

  if (typeof jsonLd === 'string') {
    try {
      jsonLdObject = JSON.parse(jsonLd);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Invalid JSON-LD schema found in seoData.jsonLd:', error);
      }
      return null;
    }
  } else if (typeof jsonLd === 'object') {
    jsonLdObject = jsonLd;
  } else {
    return null;
  }

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdObject) }} />
  );
};

export default JsonLdCustom;
