interface Props {
  directions: { directionId: number; headsign: string }[];
  activeDirection: number;
  onChange: (directionId: number) => void;
}

export default function DirectionToggle({
  directions,
  activeDirection,
  onChange,
}: Props) {
  if (directions.length <= 1) return null;

  return (
    <div className="flex rounded-lg overflow-hidden border border-gray-300">
      {directions.map((d) => (
        <button
          key={d.directionId}
          onClick={() => onChange(d.directionId)}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeDirection === d.directionId
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          {d.headsign}
        </button>
      ))}
    </div>
  );
}
