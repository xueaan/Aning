import { useState } from 'react';
import { TextButtons } from './selectors/text-buttons';
import { LinkSelector } from './selectors/link-selector';
import { ColorSelector } from './selectors/color-selector';
import { TableSelector } from './selectors/table-selector';
import { Separator } from './ui/separator';
import GenerativeMenuSwitch from './generative/generative-menu-switch';

interface BubbleMenuProps {
  className?: string;
}

export function BubbleMenu({}: BubbleMenuProps) {
  const [isColorSelectorOpen, setIsColorSelectorOpen] = useState(false);
  const [isLinkSelectorOpen, setIsLinkSelectorOpen] = useState(false);
  const [isTableSelectorOpen, setIsTableSelectorOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);

  return (
    <GenerativeMenuSwitch open={isAIOpen} onOpenChange={setIsAIOpen}>
      <Separator orientation="vertical" />
      <LinkSelector open={isLinkSelectorOpen} onOpenChange={setIsLinkSelectorOpen} />
      <Separator orientation="vertical" />
      <TableSelector open={isTableSelectorOpen} onOpenChange={setIsTableSelectorOpen} />
      <Separator orientation="vertical" />
      <TextButtons />
      <Separator orientation="vertical" />
      <ColorSelector open={isColorSelectorOpen} onOpenChange={setIsColorSelectorOpen} />
    </GenerativeMenuSwitch>
  );
}
