import { ReactNode } from "react";

type IconWrapperProps = {
  icon: ReactNode;
  text: string;
};

export const IconWrapper = ({ icon, text }: IconWrapperProps) => {
  return (
    <div className="flex items-center gap-1">
      {icon}
      <span className="text-xs sm:text-sm font-semibold">{text}</span>
    </div>
  );
};
