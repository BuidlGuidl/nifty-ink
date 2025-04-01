import Image from "next/image";

export default function Loader() {
  return (
    <div
      style={{
        margin: "0 auto",
        opacity: 0.5,
        marginTop: 12,
        width: 300,
        border: "1px solid #999999",
        boxShadow: "2px 2px 8px #AAAAAA",
      }}
    >
      <Image src="/loading.gif" alt="loading image" width={300} height={300} />
    </div>
  );
}
