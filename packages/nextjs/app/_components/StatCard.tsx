"use client";

interface StatCardProps {
  name: string;
  emoji: string;
  value: string | number;
}

const StatCard: React.FC<StatCardProps> = ({ name, emoji, value }) => {
  return (
    <li className="flex flex-col rounded-lg border border-gray-300 py-2.5 px-5 min-w-40 m-2.5">
      <div className="flex justify-between leading-0">
        <p className="text-sm text-gray-500 m-0">{name}</p>
        <span>{emoji}</span>
      </div>
      <div>
        <p className="text-left text-2xl text-gray-800">{value}</p>
      </div>
    </li>
  );
};

export default StatCard;
