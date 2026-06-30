import { FastifyInstance } from "fastify";
import { controllerHandler } from "../controllers/Handler";
import { ChurchDepartmentAdapters } from "../adapters/churchDepartmentAdapters";

export async function ChurchDepartmentRoutes(app: FastifyInstance) {
  const adapters = new ChurchDepartmentAdapters();

  app.get(
    "/api/church/departments",
    controllerHandler(adapters.getChurchDepartments.bind(adapters)),
  );

  app.get(
    "/api/church/departments/:id",
    controllerHandler(adapters.getChurchDepartmentById.bind(adapters)),
  );

  app.post(
    "/api/church/departments",
    controllerHandler(adapters.createChurchDepartment.bind(adapters)),
  );

  app.patch(
    "/api/church/departments/:id",
    controllerHandler(adapters.updateChurchDepartment.bind(adapters)),
  );

  app.delete(
    "/api/church/departments/:id",
    controllerHandler(adapters.deleteChurchDepartment.bind(adapters)),
  );

  app.get(
    "/api/church/departments/:id/tasks",
    controllerHandler(adapters.getChurchDepartmentTasks.bind(adapters)),
  );

  app.post(
    "/api/church/departments/:id/tasks",
    controllerHandler(adapters.createChurchDepartmentTask.bind(adapters)),
  );

  app.patch(
    "/api/church/departments/:departmentId/tasks/:taskId",
    controllerHandler(adapters.updateChurchDepartmentTask.bind(adapters)),
  );

  app.delete(
    "/api/church/departments/:departmentId/tasks/:taskId",
    controllerHandler(adapters.deleteChurchDepartmentTask.bind(adapters)),
  );

  app.get(
    "/api/church/departments/:id/schedules",
    controllerHandler(adapters.getChurchDepartmentSchedules.bind(adapters)),
  );

  app.post(
    "/api/church/departments/:id/schedules",
    controllerHandler(adapters.createChurchDepartmentSchedule.bind(adapters)),
  );

  app.get(
    "/api/church/schedules",
    controllerHandler(adapters.getChurchSchedules.bind(adapters)),
  );

  app.post(
    "/api/church/schedules",
    controllerHandler(adapters.createChurchSchedule.bind(adapters)),
  );

  app.patch(
    "/api/church/schedules/:id",
    controllerHandler(adapters.updateChurchSchedule.bind(adapters)),
  );

  app.delete(
    "/api/church/schedules/:id",
    controllerHandler(adapters.deleteChurchSchedule.bind(adapters)),
  );

  app.patch(
    "/api/church/schedules/:id/assignments",
    controllerHandler(adapters.updateChurchScheduleAssignments.bind(adapters)),
  );

  app.post(
    "/api/church/schedules/:id/reminders",
    controllerHandler(adapters.sendChurchScheduleReminder.bind(adapters)),
  );

  app.patch(
    "/api/church/schedules/:id/my-assignment",
    controllerHandler(adapters.updateMyChurchScheduleAssignment.bind(adapters)),
  );

  app.patch(
    "/api/church/schedules/:scheduleId/assignments/:assignmentId/attendance",
    controllerHandler(
      adapters.updateChurchScheduleAssignmentAttendance.bind(adapters),
    ),
  );

  app.get(
    "/api/church/departments/:id/resources",
    controllerHandler(adapters.getChurchDepartmentResources.bind(adapters)),
  );

  app.get(
    "/api/church/departments/:id/songs",
    controllerHandler(adapters.getChurchDepartmentSongs.bind(adapters)),
  );

  app.post(
    "/api/church/departments/:id/uploads/pdf",
    controllerHandler(adapters.uploadChurchDepartmentPdf.bind(adapters)),
  );

  app.post(
    "/api/church/departments/:id/songs",
    controllerHandler(adapters.createChurchDepartmentSong.bind(adapters)),
  );

  app.patch(
    "/api/church/departments/:departmentId/songs/:songId",
    controllerHandler(adapters.updateChurchDepartmentSong.bind(adapters)),
  );

  app.delete(
    "/api/church/departments/:departmentId/songs/:songId",
    controllerHandler(adapters.deleteChurchDepartmentSong.bind(adapters)),
  );

  app.get(
    "/api/church/my-song-preferences",
    controllerHandler(adapters.getMyChurchSongPreferences.bind(adapters)),
  );

  app.get(
    "/api/church/songs/:songId/preference",
    controllerHandler(adapters.getChurchSongPreference.bind(adapters)),
  );

  app.patch(
    "/api/church/songs/:songId/preference",
    controllerHandler(adapters.updateChurchSongPreference.bind(adapters)),
  );

  app.post(
    "/api/church/departments/:id/resources",
    controllerHandler(adapters.createChurchDepartmentResource.bind(adapters)),
  );

  app.patch(
    "/api/church/departments/:departmentId/resources/:resourceId",
    controllerHandler(adapters.updateChurchDepartmentResource.bind(adapters)),
  );

  app.delete(
    "/api/church/departments/:departmentId/resources/:resourceId",
    controllerHandler(adapters.deleteChurchDepartmentResource.bind(adapters)),
  );
}
