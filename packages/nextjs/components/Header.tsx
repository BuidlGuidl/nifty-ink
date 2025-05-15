"use client";

import React, { Suspense, useCallback, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { InkingFreeButton } from "./scaffold-eth/RainbowKitCustomConnectButton/InkingFreeButton";
import { Popover } from "antd";
import { TooltipPlacement } from "antd/es/tooltip";
import { useAccount } from "wagmi";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
  sublinks?: string[];
  subnames?: string[];
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "🔍 explore",
    href: "/explore",
  },
  {
    label: "🖌 create",
    href: "/create",
  },
  {
    label: "🖼 inks",
    href: "/artist",
  },
  {
    label: "👛 holdings",
    href: "/holdings",
  },
  {
    label: "🏆 leaderboard",
    href: "/leaderboard",
    subnames: ["🧑‍🎨 artists", "🕶 collectors"],
    sublinks: ["artists", "collectors"],
  },
  {
    label: "📊 stats",
    href: "/stats",
  },
  {
    label: "💬 chat",
    href: "https://t.me/joinchat/KByvmRpuA2XzQVYXWICiSg",
  },
];

const HeaderMenuLinksContent = ({ placement = "bottom" }: { placement: TooltipPlacement }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { address: connectedAddress } = useAccount();

  return (
    <>
      {menuLinks.map(({ label, href, icon, sublinks, subnames }) => {
        if (label === "💬 chat") {
          return (
            <li key={href} className="relative group mb-2">
              <Link
                href="https://t.me/joinchat/KByvmRpuA2XzQVYXWICiSg"
                target="_blank"
                rel="noreferrer"
                passHref
                className={`hover:bg-secondary hover:shadow-md focus:bg-secondary active:text-neutral py-1.5 px-3 text-sm rounded-full flex items-center`}
              >
                <span className="ml-2">{label}</span>
              </Link>
            </li>
          );
        }

        const isActive = pathname === href;
        if (!connectedAddress && (href === "/artist" || href === "/holdings")) {
          return (
            <li
              key={href}
              className="relative group mb-2"
              onClick={() => {
                notification.error("Please connect your wallet to view this page.");
              }}
            >
              {icon}
              <span className="ml-2">{label}</span>
            </li>
          );
        }
        return (
          <li key={href} className="relative group mb-2">
            <Link
              href={`${
                ["/artist", "/holdings"].find(item => href === item) ? `${href}/${connectedAddress}` : href
              }?${searchParams.toString()}`}
              passHref
              className={`${
                isActive ? "bg-secondary shadow-md" : ""
              } hover:bg-secondary hover:shadow-md focus:bg-secondary active:text-neutral py-1.5 px-3 text-sm rounded-full flex items-center`}
            >
              {icon}
              {sublinks && subnames ? (
                <Popover
                  content={
                    <>
                      <ul className="">
                        {sublinks.map((sublink, index) => (
                          <li key={index}>
                            <Link
                              href={`${href}/${sublink}?${searchParams.toString()}`}
                              passHref
                              className="block text-sm text-gray-700 hover:bg-gray-100 m-2"
                            >
                              {subnames[index]}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  }
                  placement={placement}
                  arrow={false}
                >
                  <span className="ml-2">{label}</span>
                </Popover>
              ) : (
                <span className="ml-2">{label}</span>
              )}
            </Link>
          </li>
        );
      })}
    </>
  );
};

export const HeaderMenuLinks = ({ placement = "bottom" }: { placement: TooltipPlacement }) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeaderMenuLinksContent placement={placement} />
    </Suspense>
  );
};

/**
 * Site header
 */
export const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const burgerMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(
    burgerMenuRef,
    useCallback(() => setIsDrawerOpen(false), []),
  );

  return (
    <div className="sticky min-[1150px]:static top-0 navbar bg-base-100 min-h-0 flex-shrink-0 justify-between z-20 shadow-md shadow-secondary px-0 sm:px-2">
      <div className="navbar-start w-auto lg:w-1/2">
        <div className="min-[1150px]:hidden dropdown" ref={burgerMenuRef}>
          <label
            tabIndex={0}
            className={`ml-1 btn btn-ghost ${isDrawerOpen ? "hover:bg-secondary" : "hover:bg-transparent"}`}
            onClick={() => {
              setIsDrawerOpen(prevIsOpenState => !prevIsOpenState);
            }}
          >
            <Bars3Icon className="h-1/2" />
          </label>
          {isDrawerOpen && (
            <ul
              tabIndex={0}
              className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52"
              onClick={() => {
                setIsDrawerOpen(false);
              }}
            >
              <HeaderMenuLinks placement="right" />
            </ul>
          )}
        </div>
        <Link
          href="/create"
          passHref
          className={`min-[1150px]:hidden hover:bg-secondary hover:shadow-md focus:bg-secondary active:text-neutral py-1.5 px-3 text-sm rounded-full flex items-center`}
        >
          <span className="ml-2">🖌 create</span>
        </Link>
        <Link href="/" passHref className="hidden min-[1150px]:flex items-center gap-2 ml-4 mr-6 shrink-0">
          <div className="flex relative text-2xl">
            <span className="mb-2">🎨 Nifty Ink</span>
          </div>
        </Link>

        <ul className="hidden min-[1150px]:flex lg:flex-nowrap menu menu-horizontal px-1 gap-2">
          <HeaderMenuLinks placement={"bottom"} />
        </ul>
      </div>
      <div className="navbar-end flex-grow mr-4">
        <RainbowKitCustomConnectButton />
        <FaucetButton />
        <InkingFreeButton />
      </div>
    </div>
  );
};
