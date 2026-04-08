import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = {
  width: 1200,
  height: 630
};
export const contentType = 'image/png';

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#ffffff',
          color: '#111111',
          padding: 64
        }}
      >
        <div style={{ fontSize: 74, fontWeight: 600, letterSpacing: 1 }}>Brady Legler</div>
        <div style={{ marginTop: 20, fontSize: 30, color: '#4b4b4b' }}>
          Fine Jewelry and Original Art
        </div>
      </div>
    ),
    size
  );
}

