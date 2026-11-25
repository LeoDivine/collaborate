"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
} from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "p-4 w-[290px] select-none",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-full", defaultClassNames.root, classNames?.root),
        months: cn(
          "relative flex flex-col gap-3 w-full",
          defaultClassNames.months,
          classNames?.months
        ),
        month: cn(
          "flex w-full flex-col gap-3",
          defaultClassNames.month,
          classNames?.month
        ),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between z-10 pointer-events-auto",
          defaultClassNames.nav,
          classNames?.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-8 w-8 select-none p-0 aria-disabled:opacity-30 !text-secondary hover:!bg-secondary/20 hover:!text-white cursor-pointer rounded-lg transition-colors",
          defaultClassNames.button_previous,
          classNames?.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-8 w-8 select-none p-0 aria-disabled:opacity-30 !text-secondary hover:!bg-secondary/20 hover:!text-white cursor-pointer rounded-lg transition-colors",
          defaultClassNames.button_next,
          classNames?.button_next
        ),
        month_caption: cn(
          "flex h-8 w-full items-center justify-center px-10",
          defaultClassNames.month_caption,
          classNames?.month_caption
        ),
        dropdowns: cn(
          "flex h-8 w-full items-center justify-center gap-2 text-sm font-medium text-secondary",
          defaultClassNames.dropdowns,
          classNames?.dropdowns
        ),
        dropdown_root: cn(
          "relative rounded-md border border-secondary/20 shadow-xs has-focus:border-secondary/40",
          defaultClassNames.dropdown_root,
          classNames?.dropdown_root
        ),
        dropdown: cn(
          "absolute inset-0 bg-popover opacity-0",
          defaultClassNames.dropdown,
          classNames?.dropdown
        ),
        caption_label: cn(
          "font-bold select-none text-secondary text-sm tracking-wide",
          captionLayout === "label"
            ? "text-sm"
            : "flex h-8 items-center gap-1 rounded-md pr-1 pl-2 text-sm [&>svg]:size-3.5 [&>svg]:text-secondary/70",
          defaultClassNames.caption_label,
          classNames?.caption_label
        ),
        month_grid: cn(
          "w-full border-collapse mt-1",
          defaultClassNames.month_grid,
          classNames?.month_grid
        ),
        weekdays: cn(
          "flex w-full items-center justify-between mb-2",
          defaultClassNames.weekdays,
          classNames?.weekdays
        ),
        weekday: cn(
          "text-secondary/60 flex-1 text-center font-semibold text-[0.75rem] py-1 select-none tracking-wider",
          defaultClassNames.weekday,
          classNames?.weekday
        ),
        week: cn(
          "flex w-full items-center justify-between mt-1",
          defaultClassNames.week,
          classNames?.week
        ),
        week_number_header: cn(
          "w-8 select-none text-secondary/60 text-xs text-center",
          defaultClassNames.week_number_header,
          classNames?.week_number_header
        ),
        week_number: cn(
          "text-[0.75rem] text-secondary/50 select-none text-center",
          defaultClassNames.week_number,
          classNames?.week_number
        ),
        day: cn(
          "relative flex-1 flex items-center justify-center p-0 text-center select-none aspect-square h-8",
          defaultClassNames.day,
          classNames?.day
        ),
        range_start: cn(
          "bg-secondary/30 rounded-l-md",
          defaultClassNames.range_start,
          classNames?.range_start
        ),
        range_middle: cn(
          "bg-secondary/20 rounded-none",
          defaultClassNames.range_middle,
          classNames?.range_middle
        ),
        range_end: cn(
          "bg-secondary/30 rounded-r-md",
          defaultClassNames.range_end,
          classNames?.range_end
        ),
        today: cn(
          "font-bold text-secondary",
          defaultClassNames.today,
          classNames?.today
        ),
        outside: cn(
          "text-secondary/25 aria-selected:text-secondary/40",
          defaultClassNames.outside,
          classNames?.outside
        ),
        disabled: cn(
          "text-secondary/20 opacity-30 pointer-events-none",
          defaultClassNames.disabled,
          classNames?.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden, classNames?.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-8 items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  const isSelectedSingle = Boolean(
    modifiers.selected &&
    !modifiers.range_start &&
    !modifiers.range_end &&
    !modifiers.range_middle
  )

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-today={modifiers.today}
      data-selected-single={isSelectedSingle}
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "h-8 w-8 aspect-square rounded-md text-xs font-medium cursor-pointer transition-all duration-150 flex items-center justify-center p-0 !text-secondary hover:!bg-secondary/20 hover:!text-white",
        // Single selected date
        "data-[selected-single=true]:!bg-secondary data-[selected-single=true]:!text-primary data-[selected-single=true]:font-bold data-[selected-single=true]:shadow-sm data-[selected-single=true]:hover:!bg-secondary/90",
        // Range start date
        "data-[range-start=true]:!bg-secondary data-[range-start=true]:!text-primary data-[range-start=true]:font-bold data-[range-start=true]:rounded-l-md data-[range-start=true]:rounded-r-none data-[range-start=true]:hover:!bg-secondary/90",
        // Range middle dates
        "data-[range-middle=true]:!bg-transparent data-[range-middle=true]:!text-secondary data-[range-middle=true]:rounded-none data-[range-middle=true]:font-semibold hover:data-[range-middle=true]:!bg-secondary/20",
        // Range end date
        "data-[range-end=true]:!bg-secondary data-[range-end=true]:!text-primary data-[range-end=true]:font-bold data-[range-end=true]:rounded-r-md data-[range-end=true]:rounded-l-none data-[range-end=true]:hover:!bg-secondary/90",
        // When start and end are on the same day
        "data-[range-start=true]:data-[range-end=true]:!rounded-md",
        // Focus state
        "group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-2 group-data-[focused=true]/day:ring-secondary/50",
        // Outside days
        "data-[outside=true]:!text-secondary/25 data-[outside=true]:hover:!bg-transparent",
        // Disabled days
        "data-[disabled=true]:!text-secondary/20 data-[disabled=true]:opacity-30 data-[disabled=true]:pointer-events-none",
        // Today
        "data-[today=true]:bg-secondary/25 data-[today=true]:border data-[today=true]:border-secondary/80 data-[today=true]:font-bold",
        defaultClassNames.day_button,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
