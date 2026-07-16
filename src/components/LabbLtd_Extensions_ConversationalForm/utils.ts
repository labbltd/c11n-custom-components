export interface ConversationFieldMeta {
  type: string;
  config: any;
  children?: ConversationFieldMeta[];
}

/**
 * Given the PConnect object of this template component, return the raw metadata
 * of all fields across regions, in authored order. Groups are flattened so every
 * field becomes one question in the conversation.
 */
export function getConversationFields(getPConnect: () => any): ConversationFieldMeta[] {
  const metadata = getPConnect().getRawMetadata();
  if (!metadata?.children) {
    return [];
  }

  // regions have their fields as children; a flat template has the fields directly
  const hasRegions = !!metadata.children[0]?.children;
  const items = hasRegions ? metadata.children.flatMap((region: any) => region.children ?? []) : metadata.children;

  return items.flatMap((item: ConversationFieldMeta) =>
    item.type === 'Group' && Array.isArray(item.children) ? item.children : [item],
  );
}

/** Treat undefined, null and the empty string as "not answered"; false and 0 are valid answers. */
export function isAnswerEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}
