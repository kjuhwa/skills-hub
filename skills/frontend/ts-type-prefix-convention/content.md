# Examples

```ts
// Good
interface IProject { id: string }
type TGrassMode = "scroll" | "auto";

// styled props inline
export const Box = styled.div<{ $w: number }>`width:${({$w})=>$w}px`;
```

```ts
// Bad
interface Project {}
type GrassMode = "scroll" | "auto";
export type TBoxProps = { $w: number };  // don't export styled-only props
```
