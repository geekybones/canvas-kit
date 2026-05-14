import type {
  MeshEffectEntry,
  MeshEffectFunction,
  RegisterMeshEffectOptions,
} from '@/elements/Text/types';

const DEFAULT_MESH_COLUMNS = 100;

const effectRegistry = new Map<string, MeshEffectEntry>();

function normalizeColumns(columns?: number): number {
  if (typeof columns !== 'number' || Number.isNaN(columns)) {
    return DEFAULT_MESH_COLUMNS;
  }

  return Math.max(1, Math.floor(columns));
}

export function registerMeshEffect(
  name: string,
  fn: MeshEffectFunction,
  options?: RegisterMeshEffectOptions,
): void {
  effectRegistry.set(name, {
    fn,
    columns: normalizeColumns(options?.columns),
  });
}

export function getMeshEffect(name: string): MeshEffectEntry | undefined {
  return effectRegistry.get(name);
}

export function listMeshEffects(): string[] {
  return [...effectRegistry.keys()];
}
