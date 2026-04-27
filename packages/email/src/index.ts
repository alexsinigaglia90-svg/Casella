export { sendEmail, type SendEmailInput } from "./client";
export { welcomeEmail } from "./templates/welcome";
export { reminderEmail, type ReminderInput } from "./templates/reminder";
export {
  skeletonEmail,
  type SkeletonInput,
  type SkeletonOutput,
} from "./templates/_skeleton";
export {
  leaveSubmittedAdminEmail,
  leaveDecidedEmployeeEmail,
  type LeaveSubmittedAdminInput,
  type LeaveDecidedEmployeeInput,
} from "./templates/leave-status";
export {
  sickSubmittedAdminEmail,
  type SickSubmittedAdminInput,
} from "./templates/sick";
