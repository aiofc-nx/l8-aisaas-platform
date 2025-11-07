/**
 * @description RedlockService 的测试替身，实现最小化的 using 方法。
 */
export class RedlockService {
  async using<T>(
    _resources: string[],
    _duration: number,
    routine: (signal: { aborted: boolean; error?: Error }) => Promise<T>,
  ): Promise<T> {
    return routine({ aborted: false });
  }
}
