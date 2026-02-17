import { ApplyContextType, ApplyContextTypes } from "@/consts";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

interface ApplySceneSectionProps {
  sceneNumber: number; // e.g., 1, 2, 3
  selectedTypes: ApplyContextType[] | null; // 変更: 配列型に
  note: string | null;
  onTypesChange: (types: ApplyContextType[]) => void; // 変更: 配列を返す
  onNoteChange: (note: string) => void;
}

export function ApplySceneSection({
  sceneNumber,
  selectedTypes, // 変更
  note,
  onTypesChange, // 変更
  onNoteChange,
}: ApplySceneSectionProps) {
  const formattedSceneNumber = String(sceneNumber).padStart(2, '0');
  const heading = `${sceneNumber + 3})応用先${formattedSceneNumber}`;
  const description = `このIDEAがどのような場面で役立つか`;
  const noteLabel = `具体的メモ`;
  const notePlaceholder = "記入する";

  const handleTypeClick = (type: ApplyContextType) => {
    const currentTypes = selectedTypes || [];
    if (currentTypes.includes(type)) {
      // 既に選択されていれば削除
      onTypesChange(currentTypes.filter(t => t !== type));
    } else {
      // 選択されていなければ追加
      onTypesChange([...currentTypes, type]);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold">{heading}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>

      {/* iOS-style Segment Control */}
      <div className="flex bg-gray-100 rounded-lg p-1 space-x-1 border border-gray-200">
        {Object.entries(ApplyContextTypes).map(([key, label]) => {
          const isSelected = selectedTypes?.includes(key as ApplyContextType); // 変更: 配列のincludesで判定
          return (
            <Button
              key={key}
              className={`flex-1 rounded-md text-sm transition-colors duration-200 h-8 ${
                isSelected
                  ? "bg-black shadow-sm text-white border border-black" // 選択時：背景黒、文字白、黒い境界線
                  : "bg-white text-black hover:bg-gray-100 border border-gray-200" // 未選択時：背景白、文字黒、薄い灰色の境界線、hoverで薄い灰色
              }`}
              onClick={() => handleTypeClick(key as ApplyContextType)} // 変更: 新しいハンドラー
            >
              {label}
            </Button>
          );
        })}
      </div>

      {/* Textarea for note */}
      <div className="space-y-2">
        <label htmlFor={`note-${formattedSceneNumber}`} className="text-sm font-medium leading-none">
          {noteLabel}
        </label>
        <Textarea
          id={`note-${formattedSceneNumber}`}
          placeholder={notePlaceholder}
          value={note || ""}
          onChange={(e) => onNoteChange(e.target.value)}
          className="min-h-[80px] rounded-lg border border-gray-200 focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-gray-300 px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}
