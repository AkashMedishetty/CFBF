import React from 'react';

const SEO = ({
  title = 'Callforblood Foundation – Privacy‑Protected Blood Donation',
  description = "India's first privacy‑protected blood donation platform with 3‑month donor hiding.",
  url = 'https://www.callforbloodfoundation.com/',
  image = '/og-card.jpg',
  noIndex = false
}) => {
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={url} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Callforblood Foundation" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </>
  );
};

export default SEO;

