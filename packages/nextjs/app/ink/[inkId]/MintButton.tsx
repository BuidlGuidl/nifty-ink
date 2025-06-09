"use client";

import React, { useState } from "react";
import { SendOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { encodeFunctionData, isAddress } from "viem";
import { gnosis } from "viem/chains";
import { useAccount, useSendCalls, useWriteContract } from "wagmi";
import { PaperAirplaneIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useChainSwitcher } from "~~/app/_hooks/useChainSwitcher";
import { AddressInput } from "~~/components/scaffold-eth";
import { NIFTY_TOKEN_CONTRACT } from "~~/contracts/externalContracts";
import { notification } from "~~/utils/scaffold-eth";

interface AddressEntry {
  id: number;
  address: string;
  error: string;
}
interface MintButtonProps {
  inkId: string;
}

const MintButton = ({ inkId }: MintButtonProps) => {
  const [minting, setMinting] = useState(false);
  const [addresses, setAddresses] = useState<AddressEntry[]>([{ id: 1, address: "", error: "" }]);
  const [modalOpen, setModalOpen] = useState(false);
  const [nextId, setNextId] = useState(2);
  const { chain } = useAccount();

  const { switchTo } = useChainSwitcher();
  const { sendCallsAsync, isPending } = useSendCalls();
  const { writeContractAsync } = useWriteContract();

  // Helper function to validate addresses
  const validateAddresses = () => {
    const validAddresses: string[] = [];
    let hasErrors = false;

    const updatedAddresses = addresses.map(entry => {
      if (!entry.address || entry.address === "") {
        hasErrors = true;
        return { ...entry, error: "Address is required" };
      } else if (isAddress(entry.address)) {
        validAddresses.push(entry.address);
        return { ...entry, error: "" };
      } else {
        hasErrors = true;
        return { ...entry, error: "Invalid address" };
      }
    });

    setAddresses(updatedAddresses);
    return { validAddresses, hasErrors };
  };

  // Helper function to create mint calls
  const createMintCalls = (addresses: string[]) => {
    return addresses.map(address => ({
      to: NIFTY_TOKEN_CONTRACT.address,
      data: encodeFunctionData({
        abi: NIFTY_TOKEN_CONTRACT.abi,
        functionName: "mint",
        args: [address, inkId],
      }),
    }));
  };

  // Helper function to handle successful minting
  const handleMintSuccess = () => {
    notification.success("Transaction completed successfully!", {
      icon: "🎉",
    });
    // Reset form and close modal on success
    setAddresses([{ id: 1, address: "", error: "" }]);
    setNextId(2);
    setModalOpen(false);
  };

  // Helper function to handle single address minting fallback
  const mintToSingleAddress = async (address: string) => {
    await writeContractAsync({
      abi: NIFTY_TOKEN_CONTRACT.abi,
      address: NIFTY_TOKEN_CONTRACT.address,
      functionName: "mint",
      args: [address, inkId],
    });
    handleMintSuccess();
  };

  // Helper function to handle specific error cases
  const handleMintError = async (error: unknown, validAddresses: string[]) => {
    if (error instanceof Error) {
      if (
        error.name === "AtomicityNotSupportedError" ||
        error.name === "AtomicReadyWalletRejectedUpgradeError" ||
        (error.cause instanceof Error && error.cause.name === "AtomicityNotSupportedError") ||
        (error.cause instanceof Error && error.cause.name === "AtomicReadyWalletRejectedUpgradeError")
      ) {
        try {
          notification.error("Batch minting not supported. Minting only to the first address.");
          await mintToSingleAddress(validAddresses[0]);
          return;
        } catch (fallbackError) {
          console.log(fallbackError);
        }
      }
    }

    notification.error("Failed to mint");
    console.log(error);
  };

  const mint = async () => {
    // Step 1: Validate addresses
    const { validAddresses, hasErrors } = validateAddresses();

    if (hasErrors || validAddresses.length === 0) {
      return;
    }

    setMinting(true);

    try {
      // Step 2: Ensure we're on the correct chain
      if (chain?.id !== gnosis.id) {
        const switched = await switchTo(gnosis);
        if (!switched) return;
      }

      // Step 3: Execute batch mint
      const calls = createMintCalls(validAddresses);
      await sendCallsAsync({ calls, experimental_fallback: true });

      // Step 4: Handle success
      handleMintSuccess();
    } catch (error) {
      // Step 5: Handle errors
      await handleMintError(error, validAddresses);
    } finally {
      setMinting(false);
    }
  };

  const handleAddressChange = (id: number, value: string) => {
    setAddresses(prev => prev.map(entry => (entry.id === id ? { ...entry, address: value, error: "" } : entry)));
  };

  const addAddressField = () => {
    setAddresses(prev => [...prev, { id: nextId, address: "", error: "" }]);
    setNextId(prev => prev + 1);
  };

  const removeAddressField = (id: number) => {
    if (addresses.length > 1) {
      setAddresses(prev => prev.filter(entry => entry.id !== id));
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setAddresses(prev => prev.map(entry => ({ ...entry, error: "" })));
  };

  return (
    <>
      {/* Trigger Button */}
      <Button icon={<SendOutlined />} onClick={() => setModalOpen(true)}>
        Mint
      </Button>

      {/* Modal */}
      <input type="checkbox" id="mint-modal" className="modal-toggle" checked={modalOpen} readOnly />
      <label htmlFor="mint-modal" className="modal cursor-pointer">
        <label className="modal-box relative w-full max-w-md">
          {/* dummy input to capture event onclick on modal box */}
          <input className="h-0 w-0 absolute top-0 left-0" />

          {/* Close button */}
          <button className="btn btn-ghost btn-sm btn-circle absolute right-3 top-3" onClick={handleModalClose}>
            ✕
          </button>

          {/* Modal title */}
          <h3 className="text-xl font-bold mb-6">Mint Artwork</h3>

          {/* Form content */}
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="label">
                  <span className="label-text font-medium">Recipient Addresses</span>
                </label>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm gap-1"
                  onClick={addAddressField}
                  disabled={minting}
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Address
                </button>
              </div>

              {addresses.map((entry, index) => (
                <div key={entry.id} className="space-y-2">
                  <div className="flex gap-2 items-start">
                    <div className="flex-1">
                      <AddressInput
                        placeholder={`Enter recipient address ${index + 1}`}
                        value={entry.address || ""}
                        onChange={(value: string) => handleAddressChange(entry.id, value)}
                      />
                      {entry.error && (
                        <label className="label">
                          <span className="label-text-alt text-error">{entry.error}</span>
                        </label>
                      )}
                    </div>
                    {addresses.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-square mt-1"
                        onClick={() => removeAddressField(entry.id)}
                        disabled={minting}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-4">
              <button className="btn btn-ghost flex-1" onClick={handleModalClose} disabled={minting}>
                Cancel
              </button>
              <button className="btn btn-primary flex-1" onClick={mint} disabled={minting}>
                {minting ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-4 w-4" />
                    Mint
                  </>
                )}
              </button>
            </div>
          </div>
        </label>
      </label>
    </>
  );
};

export default MintButton;
