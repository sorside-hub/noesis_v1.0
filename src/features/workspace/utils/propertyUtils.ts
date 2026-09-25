import { VaultData, FileNode, PropertyType, CustomProperty } from '../../../types/vault';

export interface PropertyNoteItem {
  id: string;
  name: string;
  value: any;
  displayValue: string;
  updatedAt: number;
  rawNode: FileNode;
}

export interface PropertyValueGroup {
  value: any;
  displayValue: string;
  notes: PropertyNoteItem[];
}

export interface PropertyItem {
  id: string;
  key: string;
  label: string;
  isCore: boolean;
  type: PropertyType | 'list' | 'unknown';
  totalNotesCount: number;
  valueGroups: PropertyValueGroup[];
  allNotes: PropertyNoteItem[];
}

export interface VaultPropertiesData {
  coreProperties: PropertyItem[];
  customProperties: PropertyItem[];
  totalPropertiesCount: number;
  totalNotesWithProperties: number;
}

/**
 * Format any value into a clean, human-readable display string
 */
export function formatPropertyValue(val: any): string {
  if (val === null || val === undefined || val === '') {
    return '(Kosong)';
  }
  if (typeof val === 'boolean') {
    return val ? 'True' : 'False';
  }
  if (Array.isArray(val)) {
    return val.length === 0 ? '(Kosong)' : val.join(', ');
  }
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  return String(val);
}

/**
 * Extract all properties (Core & Custom) across all markdown files in the vault.
 */
export function extractAllPropertiesFromVault(vault: VaultData): VaultPropertiesData {
  const fileNodes = Object.values(vault.nodes).filter(
    (n) => n && n.type === 'file' && !n.name.startsWith('.')
  );

  const notesWithPropsSet = new Set<string>();

  // 1. CORE PROPERTIES COLLECTORS
  const typeNotesMap = new Map<string, PropertyNoteItem[]>();
  const statusNotesMap = new Map<string, PropertyNoteItem[]>();
  const tagNotesMap = new Map<string, PropertyNoteItem[]>();
  const aliasNotesList: PropertyNoteItem[] = [];
  const emotionNotesMap = new Map<string, PropertyNoteItem[]>();

  // 2. CUSTOM PROPERTIES COLLECTORS
  // Map of propKey -> { type, map of value -> PropertyNoteItem[] }
  interface CustomPropAcc {
    key: string;
    type: PropertyType | 'list' | 'unknown';
    valueMap: Map<string, { value: any; notes: PropertyNoteItem[] }>;
    allNotes: PropertyNoteItem[];
  }
  const customPropsAcc = new Map<string, CustomPropAcc>();

  for (const node of fileNodes) {
    const meta = node.metadata || {};
    let hasAnyProp = false;

    // A. Note Type
    if (meta.noteType) {
      hasAnyProp = true;
      const typeVal = String(meta.noteType).trim();
      if (!typeNotesMap.has(typeVal)) typeNotesMap.set(typeVal, []);
      typeNotesMap.get(typeVal)!.push({
        id: node.id,
        name: node.name.replace(/\.md$/, ''),
        value: typeVal,
        displayValue: typeVal,
        updatedAt: node.updatedAt || node.createdAt || 0,
        rawNode: node,
      });
    }

    // B. Status
    if (meta.status) {
      hasAnyProp = true;
      const statusVal = String(meta.status).trim();
      if (!statusNotesMap.has(statusVal)) statusNotesMap.set(statusVal, []);
      statusNotesMap.get(statusVal)!.push({
        id: node.id,
        name: node.name.replace(/\.md$/, ''),
        value: statusVal,
        displayValue: statusVal,
        updatedAt: node.updatedAt || node.createdAt || 0,
        rawNode: node,
      });
    }

    // C. Tags
    const tags = Array.isArray(meta.tags) ? meta.tags : [];
    if (tags.length > 0) {
      hasAnyProp = true;
      tags.forEach((tag) => {
        const cleanTag = String(tag).trim().replace(/^#/, '');
        if (cleanTag) {
          if (!tagNotesMap.has(cleanTag)) tagNotesMap.set(cleanTag, []);
          tagNotesMap.get(cleanTag)!.push({
            id: node.id,
            name: node.name.replace(/\.md$/, ''),
            value: cleanTag,
            displayValue: `#${cleanTag}`,
            updatedAt: node.updatedAt || node.createdAt || 0,
            rawNode: node,
          });
        }
      });
    }

    // D. Aliases
    const aliases = Array.isArray(meta.aliases) ? meta.aliases : [];
    if (aliases.length > 0) {
      hasAnyProp = true;
      aliasNotesList.push({
        id: node.id,
        name: node.name.replace(/\.md$/, ''),
        value: aliases,
        displayValue: aliases.join(', '),
        updatedAt: node.updatedAt || node.createdAt || 0,
        rawNode: node,
      });
    }

    // E. Emotion
    if (meta.emotion && meta.emotion !== 'Neutral') {
      hasAnyProp = true;
      const emoVal = String(meta.emotion).trim();
      if (!emotionNotesMap.has(emoVal)) emotionNotesMap.set(emoVal, []);
      emotionNotesMap.get(emoVal)!.push({
        id: node.id,
        name: node.name.replace(/\.md$/, ''),
        value: emoVal,
        displayValue: emoVal,
        updatedAt: node.updatedAt || node.createdAt || 0,
        rawNode: node,
      });
    }

    // F. Custom Properties from node.metadata.customProperties array
    if (Array.isArray(meta.customProperties)) {
      meta.customProperties.forEach((cp: CustomProperty) => {
        if (!cp || !cp.key || !cp.key.trim()) return;
        hasAnyProp = true;
        const propKey = cp.key.trim();
        const propType = cp.type || 'text';
        const rawVal = cp.value;
        const displayVal = formatPropertyValue(rawVal);

        if (!customPropsAcc.has(propKey)) {
          customPropsAcc.set(propKey, {
            key: propKey,
            type: propType,
            valueMap: new Map(),
            allNotes: [],
          });
        }

        const acc = customPropsAcc.get(propKey)!;
        if (acc.type === 'unknown') {
          acc.type = propType;
        }

        const noteItem: PropertyNoteItem = {
          id: node.id,
          name: node.name.replace(/\.md$/, ''),
          value: rawVal,
          displayValue: displayVal,
          updatedAt: node.updatedAt || node.createdAt || 0,
          rawNode: node,
        };

        acc.allNotes.push(noteItem);

        if (!acc.valueMap.has(displayVal)) {
          acc.valueMap.set(displayVal, { value: rawVal, notes: [] });
        }
        acc.valueMap.get(displayVal)!.notes.push(noteItem);
      });
    }

    // G. Additional keys in node.metadata (excluding known core fields)
    const reservedKeys = new Set([
      'noteType',
      'status',
      'tags',
      'aliases',
      'customProperties',
      'bookmark',
      'id',
      'summary',
      'keywords',
      'concepts',
      'emotion',
      'ragMetadata',
      'linkedNotes',
      'outgoingLinks',
    ]);

    Object.entries(meta).forEach(([k, v]) => {
      if (reservedKeys.has(k) || !k.trim() || v === undefined || v === null) return;
      hasAnyProp = true;
      const propKey = k.trim();
      const rawVal = v;
      const displayVal = formatPropertyValue(rawVal);

      let inferredType: PropertyType | 'list' | 'unknown' = 'text';
      if (typeof rawVal === 'boolean') inferredType = 'checkbox';
      else if (typeof rawVal === 'number') inferredType = 'number';
      else if (Array.isArray(rawVal)) inferredType = 'list';

      if (!customPropsAcc.has(propKey)) {
        customPropsAcc.set(propKey, {
          key: propKey,
          type: inferredType,
          valueMap: new Map(),
          allNotes: [],
        });
      }

      const acc = customPropsAcc.get(propKey)!;
      const noteItem: PropertyNoteItem = {
        id: node.id,
        name: node.name.replace(/\.md$/, ''),
        value: rawVal,
        displayValue: displayVal,
        updatedAt: node.updatedAt || node.createdAt || 0,
        rawNode: node,
      };

      acc.allNotes.push(noteItem);

      if (!acc.valueMap.has(displayVal)) {
        acc.valueMap.set(displayVal, { value: rawVal, notes: [] });
      }
      acc.valueMap.get(displayVal)!.notes.push(noteItem);
    });

    if (hasAnyProp) {
      notesWithPropsSet.add(node.id);
    }
  }

  // BUILD CORE PROPERTIES LIST
  const coreProperties: PropertyItem[] = [];

  // 1. Type
  if (typeNotesMap.size > 0) {
    const valueGroups: PropertyValueGroup[] = Array.from(typeNotesMap.entries()).map(
      ([val, notes]) => ({
        value: val,
        displayValue: val,
        notes: notes.sort((a, b) => a.name.localeCompare(b.name)),
      })
    );
    const allNotes = Array.from(typeNotesMap.values()).flat();
    coreProperties.push({
      id: 'core_type',
      key: 'noteType',
      label: 'Type',
      isCore: true,
      type: 'select',
      totalNotesCount: allNotes.length,
      valueGroups: valueGroups.sort((a, b) => b.notes.length - a.notes.length),
      allNotes: allNotes.sort((a, b) => a.name.localeCompare(b.name)),
    });
  }

  // 2. Status
  if (statusNotesMap.size > 0) {
    const valueGroups: PropertyValueGroup[] = Array.from(statusNotesMap.entries()).map(
      ([val, notes]) => ({
        value: val,
        displayValue: val,
        notes: notes.sort((a, b) => a.name.localeCompare(b.name)),
      })
    );
    const allNotes = Array.from(statusNotesMap.values()).flat();
    coreProperties.push({
      id: 'core_status',
      key: 'status',
      label: 'Status',
      isCore: true,
      type: 'select',
      totalNotesCount: allNotes.length,
      valueGroups: valueGroups.sort((a, b) => b.notes.length - a.notes.length),
      allNotes: allNotes.sort((a, b) => a.name.localeCompare(b.name)),
    });
  }

  // 3. Tags
  if (tagNotesMap.size > 0) {
    const valueGroups: PropertyValueGroup[] = Array.from(tagNotesMap.entries()).map(
      ([val, notes]) => ({
        value: val,
        displayValue: `#${val}`,
        notes: notes.sort((a, b) => a.name.localeCompare(b.name)),
      })
    );
    // Unique notes count for tags
    const uniqueNoteIds = new Set(Array.from(tagNotesMap.values()).flatMap((n) => n.map((i) => i.id)));
    const allNotes = Array.from(
      new Map(
        Array.from(tagNotesMap.values())
          .flat()
          .map((n) => [n.id, n])
      ).values()
    );

    coreProperties.push({
      id: 'core_tags',
      key: 'tags',
      label: 'Tags',
      isCore: true,
      type: 'list',
      totalNotesCount: uniqueNoteIds.size,
      valueGroups: valueGroups.sort((a, b) => b.notes.length - a.notes.length),
      allNotes: allNotes.sort((a, b) => a.name.localeCompare(b.name)),
    });
  }

  // 4. Aliases
  if (aliasNotesList.length > 0) {
    coreProperties.push({
      id: 'core_aliases',
      key: 'aliases',
      label: 'Aliases',
      isCore: true,
      type: 'list',
      totalNotesCount: aliasNotesList.length,
      valueGroups: [
        {
          value: 'has_aliases',
          displayValue: `${aliasNotesList.length} Catatan dengan Alias`,
          notes: aliasNotesList.sort((a, b) => a.name.localeCompare(b.name)),
        },
      ],
      allNotes: aliasNotesList.sort((a, b) => a.name.localeCompare(b.name)),
    });
  }

  // 5. Emotion
  if (emotionNotesMap.size > 0) {
    const valueGroups: PropertyValueGroup[] = Array.from(emotionNotesMap.entries()).map(
      ([val, notes]) => ({
        value: val,
        displayValue: val,
        notes: notes.sort((a, b) => a.name.localeCompare(b.name)),
      })
    );
    const allNotes = Array.from(emotionNotesMap.values()).flat();
    coreProperties.push({
      id: 'core_emotion',
      key: 'emotion',
      label: 'Emotion (AI)',
      isCore: true,
      type: 'select',
      totalNotesCount: allNotes.length,
      valueGroups: valueGroups.sort((a, b) => b.notes.length - a.notes.length),
      allNotes: allNotes.sort((a, b) => a.name.localeCompare(b.name)),
    });
  }

  // BUILD CUSTOM PROPERTIES LIST
  const customProperties: PropertyItem[] = Array.from(customPropsAcc.values()).map((acc) => {
    const valueGroups: PropertyValueGroup[] = Array.from(acc.valueMap.entries()).map(
      ([displayVal, entry]) => ({
        value: entry.value,
        displayValue: displayVal,
        notes: entry.notes.sort((a, b) => a.name.localeCompare(b.name)),
      })
    );

    return {
      id: `custom_${acc.key.toLowerCase().replace(/\s+/g, '_')}`,
      key: acc.key,
      label: acc.key,
      isCore: false,
      type: acc.type,
      totalNotesCount: acc.allNotes.length,
      valueGroups: valueGroups.sort((a, b) => b.notes.length - a.notes.length),
      allNotes: acc.allNotes.sort((a, b) => a.name.localeCompare(b.name)),
    };
  });

  return {
    coreProperties,
    customProperties: customProperties.sort((a, b) => a.label.localeCompare(b.label)),
    totalPropertiesCount: coreProperties.length + customProperties.length,
    totalNotesWithProperties: notesWithPropsSet.size,
  };
}
