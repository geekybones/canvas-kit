import type {
  MeshEffect,
  MeshEffectFunction,
  RegisterMeshEffectOptions,
} from '@/elements/Text/types';
import { BUILTIN_EFFECTS } from '@/elements/Text/Vector/effects';

const DEFAULT_MESH_COLUMNS = 100;

// Named import of BUILTIN_EFFECTS ensures this module is included even with sideEffects:false.
const effectRegistry = new Map<string, MeshEffect>(Object.entries(BUILTIN_EFFECTS));

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

export function getMeshEffect(name: string): MeshEffect | undefined {
  return effectRegistry.get(name);
}

export function listMeshEffects(): string[] {
  return [...effectRegistry.keys()];
}
