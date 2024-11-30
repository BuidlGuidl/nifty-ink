import { useEffect, useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { Address as AddressType } from "viem";
import { CheckCircleIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";

type PrivateKeyModalProps = {
  address: AddressType;
  modalId: string;
};

export const PrivateKeyModal = ({ address, modalId }: PrivateKeyModalProps) => {
  const [pk, setPk] = useState<string | null>(null);

  useEffect(() => {
    const value = localStorage.getItem("burnerWallet.pk");
    setPk(value);
  }, []);

  const [pkCopied, setPkCopied] = useState(false);
  return (
    <>
      <div>
        <input type="checkbox" id={`${modalId}`} className="modal-toggle" />
        <label htmlFor={`${modalId}`} className="modal cursor-pointer">
          <label className="modal-box relative">
            {/* dummy input to capture event onclick on modal box */}
            <input className="h-0 w-0 absolute top-0 left-0" />
            <label htmlFor={`${modalId}`} className="btn btn-ghost btn-sm btn-circle absolute right-3 top-3">
              ✕
            </label>
            <div className="space-y-3 py-6">
              <div className="flex flex-col items-center gap-6">
                <Address address={address} format="long" disableAddressLink />
                <div>
                  Private key:{" "}
                  <span className="text-[11px]">
                    {pk}
                    <CopyToClipboard
                      text={pk || ""}
                      onCopy={() => {
                        setPkCopied(true);
                        setTimeout(() => {
                          setPkCopied(false);
                        }, 800);
                      }}
                    >
                      <button onClick={e => e.stopPropagation()} type="button">
                        {pkCopied ? (
                          <CheckCircleIcon
                            className={"ml-1.5 text-xl font-normal text-sky-600 h-4 w-4 cursor-pointer"}
                            aria-hidden="true"
                          />
                        ) : (
                          <DocumentDuplicateIcon
                            className={"ml-1.5 text-xl font-normal text-sky-600 h-4 w-4 cursor-pointer"}
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </CopyToClipboard>
                  </span>
                </div>
              </div>
            </div>
          </label>
        </label>
      </div>
    </>
  );
};
