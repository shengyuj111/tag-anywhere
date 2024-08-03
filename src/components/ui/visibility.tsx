export interface VisibilityProps {
  isVisible?: boolean;
  children: React.ReactNode;
}

export const Visibility = ({ isVisible = true, children }: VisibilityProps) => {
  return isVisible ? <>{children}</> : null;
};
