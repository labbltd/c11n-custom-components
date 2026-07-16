export interface SummaryField {
  label?: string;
  value?: unknown;
  type: string;
}

export interface SummarySection {
  heading?: string;
  fields: SummaryField[];
  fromGroup: boolean;
}

export interface FlowStep {
  ID: string;
  name: string;
  visited_status: string;
  steps?: FlowStep[];
}

/**
 * Given the PConnect object of this template component, group the children of all
 * regions into sections. Authored groups become their own section (heading = group
 * label); consecutive loose fields are collected into an unnamed section.
 */
export function getSummarySections(getPConnect: () => any): SummarySection[] {
  const metadata = getPConnect().getRawMetadata();
  if (!metadata?.children) {
    return [];
  }

  // regions have their fields as children; a flat template has the fields directly
  const hasRegions = !!metadata.children[0]?.children;
  const items = hasRegions ? metadata.children.flatMap((region: any) => region.children ?? []) : metadata.children;

  const resolveField = (field: any): SummaryField => ({
    ...getPConnect().resolveConfigProps(field.config),
    type: field.type,
  });

  const sections: SummarySection[] = [];
  let looseSection: SummarySection | null = null;
  for (const item of items) {
    if (item.type === 'Group' && Array.isArray(item.children)) {
      sections.push({
        heading: getPConnect().resolveConfigProps(item.config)?.label,
        fields: item.children.map(resolveField),
        fromGroup: true,
      });
      looseSection = null;
    } else {
      if (!looseSection) {
        looseSection = { fields: [], fromGroup: false };
        sections.push(looseSection);
      }
      looseSection.fields.push(resolveField(item));
    }
  }
  return sections;
}

/**
 * Read the multi-step navigation of the current assignment from the store and
 * return the completed (visited) steps in flow order, flattening sub-processes.
 * Returns an empty array when the assignment is not a multi-step form.
 */
export function getVisitedSteps(getPConnect: () => any): FlowStep[] {
  const navigation = getPConnect().getValue(window.PCore.getConstants().CASE_INFO.NAVIGATION);
  const visited: FlowStep[] = [];
  const walk = (steps: FlowStep[]) => {
    for (const step of steps) {
      if (Array.isArray(step.steps) && step.steps.length > 0) {
        walk(step.steps);
      } else if (step.visited_status === 'success') {
        visited.push(step);
      }
    }
  };
  walk(navigation?.steps ?? []);
  return visited;
}

/**
 * Find the flow step a section should link back to: prefer a step whose name
 * matches the section heading, otherwise fall back to matching by position.
 */
export function getStepForSection(
  section: SummarySection,
  sectionIndex: number,
  steps: FlowStep[],
): FlowStep | undefined {
  if (section.heading) {
    const byName = steps.find((step) => step.name?.trim().toLowerCase() === section.heading?.trim().toLowerCase());
    if (byName) {
      return byName;
    }
  }
  return steps[sectionIndex];
}
