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
            className="flex cursor-pointer items-center px-3 py-2 text-left text-sm hover:bg-accent rounded-sm"
              key={option.value}
            >
              <span className="text-sm">{option.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
    </Command>
  );
};

export default AISelectorCommands;






