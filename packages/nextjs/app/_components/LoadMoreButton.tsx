import React from "react";

type LoadMoreButtonProps = {
  allItemsLoaded: boolean;
  allItemsLoadedText: string;
  moreInksLoading: boolean;
};

const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({ allItemsLoaded, allItemsLoadedText, moreInksLoading }) => {
  return (
    <div className="flex items-center justify-center">
      <div aria-label="Page navigation" className="flex space-x-2">
        <div>
          {allItemsLoaded ? (
            <div className="mt-2 text-lg">{allItemsLoadedText}</div>
          ) : (
            <button type="button" className="btn btn-primary mt-2 flex items-center" disabled={moreInksLoading}>
              {moreInksLoading ? "Loading..." : "Load more"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadMoreButton;
