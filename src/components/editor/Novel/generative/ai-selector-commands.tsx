import { Command, CommandGroup, CommandItem } from "@/components/ui/command";

const options = [
  {
    value: "improve",
    label: "改进文笔"},
  {
    value: "fix",
    label: "修正语法"},
  {
    value: "shorter",
    label: "内容简化"},
  {
    value: "longer", 
    label: "内容扩展"},
];

interface AISelectorCommandsProps {
  onSelect: (value: string, option: string) => void;
}

const AISelectorCommands = ({ onSelect }: AISelectorCommandsProps) => {
  return (
    <Command>
      <CommandGroup>
          {options.map((option) => (
            <CommandItem onSelect={() => onSelect(option.label, option.value)}
            className="flex cursor-pointer items-center gap-2 px-4 py-2 text-left text-sm hover:bg-accent"
              key={option.value}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-background">
                {option.value === "improve" && "✨"}
                {option.value === "fix" && "🔧"}  
                {option.value === "shorter" && "✂️"}
                {option.value === "longer" && "📝"}
              </div>
              <span>{option.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
    </Command>
  );
};

export default AISelectorCommands;






