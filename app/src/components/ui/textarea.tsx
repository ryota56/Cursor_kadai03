import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps extends React.ComponentProps<"textarea"> {
  error?: boolean;
  helperText?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          ref={ref}
          data-slot="textarea"
          className={cn(
            // 基本スタイル
            "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "resize-y transition-colors",
            // 適切なサイズ設定
            "min-h-[140px] max-h-[480px]",
            // エラー状態
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          style={{
            minHeight: '140px',
            maxHeight: '480px',
            resize: 'vertical'
          }}
          {...props}
        />
        {helperText && (
          <p className={cn(
            "text-xs mt-1",
            error ? "text-red-600" : "text-gray-500"
          )}>
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = "Textarea"

export { Textarea }
