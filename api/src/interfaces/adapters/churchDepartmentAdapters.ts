import { FastifyRequest } from "fastify/types/request";
import { DepartmentContext } from "./churchDepartment/context";
import { DepartmentCore } from "./churchDepartment/department";
import { TaskAdapters } from "./churchDepartment/task";
import { ScheduleAdapters } from "./churchDepartment/schedule";
import { SongAdapters } from "./churchDepartment/song";
import { ResourceAdapters } from "./churchDepartment/resource";

// Facade fino: a logica de fato mora em ./churchDepartment/* (um arquivo por
// area - department, task, schedule, song, resource - todos compartilhando
// autenticacao/autorizacao via DepartmentContext). Esta classe existe pra
// preservar a instancia que ChurchDepartmentRoutes.ts e os testes ja usam
// (`new ChurchDepartmentAdapters()` com os mesmos 38 metodos publicos).
export class ChurchDepartmentAdapters {
  private context = new DepartmentContext();
  private department = new DepartmentCore(this.context);
  private task = new TaskAdapters(this.context);
  private schedule = new ScheduleAdapters(this.context);
  private song = new SongAdapters(this.context);
  private resource = new ResourceAdapters(this.context);

  // Ministerio / membro
  async getChurchDepartments(request: FastifyRequest) {
    return this.department.getChurchDepartments(request);
  }

  async createChurchDepartment(request: FastifyRequest) {
    return this.department.createChurchDepartment(request);
  }

  async getChurchDepartmentById(request: FastifyRequest) {
    return this.department.getChurchDepartmentById(request);
  }

  async updateChurchDepartment(request: FastifyRequest) {
    return this.department.updateChurchDepartment(request);
  }

  async deleteChurchDepartment(request: FastifyRequest) {
    return this.department.deleteChurchDepartment(request);
  }

  async listChurchDepartmentScheduleManagers(request: FastifyRequest) {
    return this.department.listChurchDepartmentScheduleManagers(request);
  }

  async addChurchDepartmentMember(request: FastifyRequest) {
    return this.department.addChurchDepartmentMember(request);
  }

  async removeChurchDepartmentMember(request: FastifyRequest) {
    return this.department.removeChurchDepartmentMember(request);
  }

  // Tarefas
  async getChurchDepartmentTasks(request: FastifyRequest) {
    return this.task.getChurchDepartmentTasks(request);
  }

  async createChurchDepartmentTask(request: FastifyRequest) {
    return this.task.createChurchDepartmentTask(request);
  }

  async updateChurchDepartmentTask(request: FastifyRequest) {
    return this.task.updateChurchDepartmentTask(request);
  }

  async deleteChurchDepartmentTask(request: FastifyRequest) {
    return this.task.deleteChurchDepartmentTask(request);
  }

  // Escala / atribuicao / presenca
  async getChurchDepartmentSchedules(request: FastifyRequest) {
    return this.schedule.getChurchDepartmentSchedules(request);
  }

  async getChurchSchedules(request: FastifyRequest) {
    return this.schedule.getChurchSchedules(request);
  }

  async createChurchDepartmentSchedule(request: FastifyRequest) {
    return this.schedule.createChurchDepartmentSchedule(request);
  }

  async createChurchSchedule(request: FastifyRequest) {
    return this.schedule.createChurchSchedule(request);
  }

  async updateChurchSchedule(request: FastifyRequest) {
    return this.schedule.updateChurchSchedule(request);
  }

  async sendChurchScheduleReminder(request: FastifyRequest) {
    return this.schedule.sendChurchScheduleReminder(request);
  }

  async deleteChurchSchedule(request: FastifyRequest) {
    return this.schedule.deleteChurchSchedule(request);
  }

  async updateChurchScheduleAssignments(request: FastifyRequest) {
    return this.schedule.updateChurchScheduleAssignments(request);
  }

  async updateMyChurchScheduleAssignment(request: FastifyRequest) {
    return this.schedule.updateMyChurchScheduleAssignment(request);
  }

  async updateChurchScheduleAssignmentAttendance(request: FastifyRequest) {
    return this.schedule.updateChurchScheduleAssignmentAttendance(request);
  }

  async reorderScheduleMediaItems(request: FastifyRequest) {
    return this.schedule.reorderScheduleMediaItems(request);
  }

  // Musica / preferencia / import
  async importCifraClubSong(request: FastifyRequest) {
    return this.song.importCifraClubSong(request);
  }

  async getChurchDepartmentSongs(request: FastifyRequest) {
    return this.song.getChurchDepartmentSongs(request);
  }

  async createChurchDepartmentSong(request: FastifyRequest) {
    return this.song.createChurchDepartmentSong(request);
  }

  async previewSongsFromPdf(request: FastifyRequest) {
    return this.song.previewSongsFromPdf(request);
  }

  async importSongsFromPdf(request: FastifyRequest) {
    return this.song.importSongsFromPdf(request);
  }

  async updateChurchDepartmentSong(request: FastifyRequest) {
    return this.song.updateChurchDepartmentSong(request);
  }

  async deleteChurchDepartmentSong(request: FastifyRequest) {
    return this.song.deleteChurchDepartmentSong(request);
  }

  async getChurchSongPreference(request: FastifyRequest) {
    return this.song.getChurchSongPreference(request);
  }

  async updateChurchSongPreference(request: FastifyRequest) {
    return this.song.updateChurchSongPreference(request);
  }

  async getMyChurchSongPreferences(request: FastifyRequest) {
    return this.song.getMyChurchSongPreferences(request);
  }

  // Recurso / upload de PDF
  async uploadChurchDepartmentPdf(request: FastifyRequest) {
    return this.resource.uploadChurchDepartmentPdf(request);
  }

  async getChurchDepartmentResources(request: FastifyRequest) {
    return this.resource.getChurchDepartmentResources(request);
  }

  async createChurchDepartmentResource(request: FastifyRequest) {
    return this.resource.createChurchDepartmentResource(request);
  }

  async updateChurchDepartmentResource(request: FastifyRequest) {
    return this.resource.updateChurchDepartmentResource(request);
  }

  async deleteChurchDepartmentResource(request: FastifyRequest) {
    return this.resource.deleteChurchDepartmentResource(request);
  }
}
