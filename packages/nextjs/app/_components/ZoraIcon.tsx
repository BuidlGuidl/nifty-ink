import { zoraImg } from "~~/utils/zoraImg";

export const ZoraIcon = ({ className }: { className: string }) => {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: "relative", display: "block" }}
      className={className}
    >
      <rect width="30" height="30" fill="url(#pattern0)"></rect>
      <defs>
        <pattern id="pattern0" patternContentUnits="objectBoundingBox" width="1" height="1">
          <use xlinkHref="#image0_1_18" transform="scale(0.00041841)"></use>
        </pattern>
        <image id="image0_1_18" width="2390" height="2390" xlinkHref={zoraImg}></image>
      </defs>
    </svg>
  );
};
