import { cx } from "@ui/cx";
import { IconButton } from "@ui/IconButton";
import { useToast } from "@ui/toastContext";

export function FavoriteStar({
  name,
  favorite,
  onToggle,
  className,
  ...rest
}: {
  name: string;
  favorite: boolean;
  onToggle: () => void;
  className?: string;
  "data-testid"?: string;
}) {
  const toast = useToast();
  const label = favorite ? `Unfavorite ${name}` : `Favorite ${name}`;

  return (
    <IconButton
      on={favorite}
      className={className}
      {...rest}
      aria-pressed={favorite}
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
        toast({
          intent: "success",
          title: favorite ? "Unfavorited" : "Favorited",
          message: (
            <>
              <strong>{name}</strong>
              {favorite ? " removed from Actions tab" : " added to Actions tab"}
            </>
          ),
          icon: <i className="fa-solid fa-star" aria-hidden="true" />,
        });
      }}
    >
      <i className={cx(favorite ? "fa-solid" : "fa-regular", "fa-star")} aria-hidden="true" />
    </IconButton>
  );
}
