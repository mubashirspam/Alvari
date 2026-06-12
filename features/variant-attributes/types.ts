import type { CategoryVariantAttributeRow } from "@/lib/db/schema";

/** Client-safe shape passed from server pages into pickers/forms. */
export type VariantAttributeDef = {
  key: string;
  label: string;
  inputType: CategoryVariantAttributeRow["inputType"];
  options: string[];
  isRequired: boolean;
};

export function mapAttributeDefRow(
  row: CategoryVariantAttributeRow,
): VariantAttributeDef {
  return {
    key: row.key,
    label: row.label,
    inputType: row.inputType,
    options: row.options,
    isRequired: row.isRequired,
  };
}
