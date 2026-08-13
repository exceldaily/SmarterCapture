import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#111411",
      }}
    >
      <div
        style={{
          width: 280,
          height: 280,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "58px solid #f3f2ec",
          borderRadius: "50%",
        }}
      >
        <div style={{ width: 54, height: 54, borderRadius: "50%", background: "#dafa52" }} />
      </div>
    </div>,
    size,
  );
}
