import { useEffect, useRef } from "react";
import { useOutsideClick } from "~~/hooks/scaffold-eth";

export const FirstVisitModal = ({ balance }: { balance: string }) => {
  const dropdownRef = useRef<HTMLDetailsElement>(null);

  const closeDropdown = () => {
    dropdownRef.current?.removeAttribute("open");
  };
  useOutsideClick(dropdownRef, closeDropdown);

  useEffect(() => {
    if (parseFloat(balance) >= 0.01) {
      return;
    }
    const hasVisited = localStorage.getItem("hasVisited");

    if (!hasVisited) {
      localStorage.setItem("hasVisited", "true");
      dropdownRef.current?.setAttribute("open", "");
    }

    const timer = setTimeout(() => {
      closeDropdown();
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <details ref={dropdownRef} className="dropdown dropdown-end leading-3">
        <summary tabIndex={0} className="hidden"></summary>
        <ul
          tabIndex={0}
          className="dropdown-content menu z-[2] p-2 mt-5 shadow-center shadow-accent bg-base-200 rounded-box gap-1 w-[250px]"
        >
          <li>Welcome to 🎨 Nifty Ink!</li>
          <li>You currently have zero xDai, but don&apos;t worry!</li>
          <li>
            Once you create your first ink, you&apos;ll receive a small amount of xDai—just enough to cover several
            transactions!
          </li>
          <li></li>
          <li>Click anywhere to close this or it will close in 10 seconds.</li>
        </ul>
      </details>
    </>
  );
};
