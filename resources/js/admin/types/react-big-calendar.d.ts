declare module 'react-big-calendar' {
  export interface Event {
    title?: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    resource?: any;
  }

  export const Calendar: any;
  export const dateFnsLocalizer: any;
  export const Views: any;
}
