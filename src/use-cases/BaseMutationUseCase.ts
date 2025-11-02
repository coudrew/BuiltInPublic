import { AnySupabaseClient } from 'utils/supabase/server';

export abstract class BaseMutationUseCase<
  TParams,
  TResult = { success: boolean; message: string },
> {
  supabase: AnySupabaseClient;

  constructor(supabase: AnySupabaseClient) {
    this.supabase = supabase;
  }

  abstract execute(params: TParams): Promise<TResult>;

  compactUpdateData(updateData: Partial<TParams>): Partial<TParams> {
    if (!(updateData satisfies Partial<TParams>)) {
      throw new Error('INVALID_UPDATE_DATA');
    }

    const update = Object.fromEntries(
      Object.entries(updateData).filter(
        ([key, value]) => value !== undefined // Only filter out undefined values
      )
    ) as Partial<TParams>;

    if (!Object.entries(update).length) {
      throw new Error('NO_VALID_FIELDS');
    }

    return update;
  }
}
