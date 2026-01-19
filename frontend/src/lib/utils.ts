import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Swal from "sweetalert2";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type NotifType = "success" | "error"


export function sendNotif(type: NotifType, message: string): void {
    Swal.fire({
      title: type.toUpperCase() + '!',
      text: message,
      icon: type,
      showConfirmButton: false,
      toast: true,
      timer: 3000,
      position: 'top'
    })
}