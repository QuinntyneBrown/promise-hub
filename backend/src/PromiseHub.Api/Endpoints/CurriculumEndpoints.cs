using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using PromiseHub.Api.Authorization;
using PromiseHub.Api.Modules;
using PromiseHub.Application;
using PromiseHub.Application.Curriculum;
using PromiseHub.Application.Identity;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Endpoints;

/// <summary>Curriculum authoring (L2-066, L2-067, L2-073, L2-074, L2-084 to L2-086, ADR 0050, ADR 0054, ADR 0058): the Learning module and AuthorCurriculum (admins and program directors) on every endpoint.</summary>
public static class CurriculumEndpoints
{
    /// <summary>Room for the multipart boundaries and headers around one file.</summary>
    private const long FormOverhead = 64 * 1024;

    public static IEndpointRouteBuilder MapCurriculumEndpoints(this IEndpointRouteBuilder app)
    {
        var curriculum = app.MapGroup("/curriculum").RequireModule(ModuleId.Learning).RequirePermission(Permission.AuthorCurriculum);
        curriculum.MapGet("/", (CurriculumHandler handler, CancellationToken ct) => handler.HandleAsync(ct));
        curriculum.MapPost("/tracks", async (CreateTrackCommand command, TrackCommands handler, CancellationToken ct) =>
            (await handler.CreateAsync(command, ct)).ToHttp("/curriculum/tracks"));
        curriculum.MapPut("/tracks/{id:guid}/module-order", async (Guid id, ModuleOrderCommand command, TrackCommands handler, CancellationToken ct) =>
            (await handler.ReorderModulesAsync(id, command.ModuleIds, ct)).ToHttp());
        curriculum.MapPost("/modules", async (CreateModuleCommand command, ModuleCommands handler, CancellationToken ct) =>
            (await handler.CreateAsync(command, ct)).ToHttp("/curriculum/modules"));
        curriculum.MapGet("/modules/{id:guid}", async (Guid id, ModuleHandler handler, CancellationToken ct) =>
            await handler.HandleAsync(id, ct) is { } module ? Results.Ok(module) : Results.NotFound());
        curriculum.MapPut("/modules/{id:guid}", async (Guid id, SaveModuleCommand command, ModuleCommands handler, CancellationToken ct) =>
            (await handler.UpdateAsync(id, command, ct)).ToHttp());
        curriculum.MapPut("/tracks/{id:guid}/cohorts", async (Guid id, CohortsCommand command, TrackCommands handler, CancellationToken ct) =>
            (await handler.SetCohortsAsync(id, command.ProgramIds, ct)).ToHttp());
        curriculum.MapPut("/tracks/{id:guid}/status", async (Guid id, StatusCommand command, TrackCommands handler, CancellationToken ct) =>
            (await handler.SetStatusAsync(id, command.Status, ct)).ToHttp());
        curriculum.MapPut("/modules/{id:guid}/status", async (Guid id, StatusCommand command, ModuleCommands handler, CancellationToken ct) =>
            (await handler.SetStatusAsync(id, command.Status, ct)).ToHttp());
        curriculum.MapPut("/modules/{id:guid}/lesson-order", async (Guid id, LessonOrderCommand command, ModuleCommands handler, CancellationToken ct) =>
            (await handler.ReorderLessonsAsync(id, command.LessonIds, ct)).ToHttp());
        curriculum.MapPost("/lessons", async (CreateLessonCommand command, LessonCommands handler, CancellationToken ct) =>
            (await handler.CreateAsync(command, ct)).ToHttp("/curriculum/lessons"));
        curriculum.MapGet("/lessons/{id:guid}", async (Guid id, LessonHandler handler, CancellationToken ct) =>
            await handler.HandleAsync(id, ct) is { } lesson ? Results.Ok(lesson) : Results.NotFound());
        curriculum.MapPut("/lessons/{id:guid}", async (Guid id, SaveLessonCommand command, LessonCommands handler, CancellationToken ct) =>
            (await handler.UpdateAsync(id, command, ct)).ToHttp());
        curriculum.MapPut("/lessons/{id:guid}/status", async (Guid id, StatusCommand command, LessonCommands handler, CancellationToken ct) =>
            (await handler.SetStatusAsync(id, command.Status, ct)).ToHttp());
        curriculum.MapDelete("/lessons/{id:guid}", async (Guid id, LessonCommands handler, CancellationToken ct) =>
            (await handler.DeleteAsync(id, ct)).ToHttp());
        curriculum.MapPost("/quizzes", async (CreateQuizCommand command, QuizCommands handler, CancellationToken ct) =>
            (await handler.CreateAsync(command, ct)).ToHttp("/curriculum/quizzes"));
        curriculum.MapGet("/quizzes/{id:guid}", async (Guid id, QuizHandler handler, CancellationToken ct) =>
            await handler.HandleAsync(id, ct) is { } quiz ? Results.Ok(quiz) : Results.NotFound());
        curriculum.MapPut("/quizzes/{id:guid}", async (Guid id, SaveQuizCommand command, QuizCommands handler, CancellationToken ct) =>
            (await handler.UpdateAsync(id, command, ct)).ToHttp());
        curriculum.MapPut("/quizzes/{id:guid}/question-order", async (Guid id, QuestionOrderCommand command, QuizCommands handler, CancellationToken ct) =>
            (await handler.ReorderAsync(id, command.QuestionIds, ct)).ToHttp());
        curriculum.MapPut("/quizzes/{id:guid}/status", async (Guid id, StatusCommand command, QuizCommands handler, CancellationToken ct) =>
            (await handler.SetStatusAsync(id, command.Status, ct)).ToHttp());
        curriculum.MapPost("/quizzes/{id:guid}/questions", async (Guid id, QuestionCommand command, QuestionCommands handler, CancellationToken ct) =>
            (await handler.AddAsync(id, command, ct)).ToHttp("/curriculum/quiz-questions"));
        curriculum.MapPut("/quiz-questions/{id:guid}", async (Guid id, QuestionCommand command, QuestionCommands handler, CancellationToken ct) =>
            (await handler.UpdateAsync(id, command, ct)).ToHttp());
        curriculum.MapDelete("/quiz-questions/{id:guid}", async (Guid id, QuestionCommands handler, CancellationToken ct) =>
            (await handler.DeleteAsync(id, ct)).ToHttp());
        curriculum.MapPost("/assignments", async (CreateAssignmentCommand command, AssignmentCommands handler, CancellationToken ct) =>
            (await handler.CreateAsync(command, ct)).ToHttp("/curriculum/assignments"));
        curriculum.MapGet("/assignments/{id:guid}", async (Guid id, AssignmentHandler handler, CancellationToken ct) =>
            await handler.HandleAsync(id, ct) is { } assignment ? Results.Ok(assignment) : Results.NotFound());
        curriculum.MapPut("/assignments/{id:guid}", async (Guid id, SaveAssignmentCommand command, AssignmentCommands handler, CancellationToken ct) =>
            (await handler.UpdateAsync(id, command, ct)).ToHttp());
        curriculum.MapPut("/assignments/{id:guid}/status", async (Guid id, StatusCommand command, AssignmentCommands handler, CancellationToken ct) =>
            (await handler.SetStatusAsync(id, command.Status, ct)).ToHttp());
        curriculum.MapGet("/badges", (BadgesHandler handler, CancellationToken ct) => handler.ListAsync(ct));
        curriculum.MapGet("/badges/options", (BadgesHandler handler, CancellationToken ct) => handler.OptionsAsync(ct));
        curriculum.MapGet("/badges/{id:guid}", async (Guid id, BadgesHandler handler, CancellationToken ct) =>
            await handler.GetAsync(id, ct) is { } badge ? Results.Ok(badge) : Results.NotFound());
        curriculum.MapPost("/badges", async (BadgeCommand command, BadgeCommands handler, CancellationToken ct) =>
            (await handler.CreateAsync(command, ct)).ToHttp("/curriculum/badges"));
        curriculum.MapPut("/badges/{id:guid}", async (Guid id, BadgeCommand command, BadgeCommands handler, CancellationToken ct) =>
            (await handler.UpdateAsync(id, command, ct)).ToHttp());
        curriculum.MapDelete("/badges/{id:guid}", async (Guid id, BadgeCommands handler, CancellationToken ct) =>
            (await handler.DeleteAsync(id, ct)).ToHttp());
        curriculum.MapPost("/badges/{id:guid}/awards", async (Guid id, AwardBadgeRequest request, BadgeAwardCommand handler, CancellationToken ct) =>
        {
            var award = await handler.AwardAsync(id, request, ct);
            return award.Status == ResultStatus.Done ? Results.Created($"/curriculum/badges/{id}/awards/{award.Value}", new { id = award.Value }) : award.ToHttp();
        });
        curriculum.MapGet("/progression", (ProgressionHandler handler, CancellationToken ct) => handler.HandleAsync(ct));
        curriculum.MapPost("/progression/stages", async (StageCommand command, ProgressionCommands handler, CancellationToken ct) =>
            (await handler.AddStageAsync(command, ct)).ToHttp("/curriculum/progression/stages"));
        curriculum.MapPut("/progression/stages/{id:guid}", async (Guid id, StageCommand command, ProgressionCommands handler, CancellationToken ct) =>
            (await handler.UpdateStageAsync(id, command, ct)).ToHttp());
        curriculum.MapPut("/progression/stage-order", async (StageOrderCommand command, ProgressionCommands handler, CancellationToken ct) =>
            (await handler.ReorderAsync(command.StageIds, ct)).ToHttp());
        curriculum.MapPost("/progression/stages/{id:guid}/competencies", async (Guid id, CompetencyCommand command, ProgressionCommands handler, CancellationToken ct) =>
            (await handler.AddCompetencyAsync(id, command, ct)).ToHttp("/curriculum/progression/competencies"));
        curriculum.MapDelete("/progression/competencies/{id:guid}", async (Guid id, ProgressionCommands handler, CancellationToken ct) =>
            (await handler.RemoveCompetencyAsync(id, ct)).ToHttp());
        curriculum.MapPost("/lessons/{id:guid}/video", async (Guid id, HttpRequest request, LessonVideoHandler handler, LessonVideoOptions options, CancellationToken ct) =>
        {
            if (!request.HasFormContentType || request.ContentLength > options.MaxBytes + FormOverhead)
            {
                return LessonVideoHandler.Refused().ToHttp();
            }
            IFormCollection form;
            try
            {
                form = await request.ReadFormAsync(new FormOptions { MultipartBodyLengthLimit = options.MaxBytes + FormOverhead }, ct);
            }
            catch (InvalidDataException)
            {
                // A malformed or oversized multipart body.
                return LessonVideoHandler.Refused().ToHttp();
            }
            if (form.Files.GetFile("file") is not { } file)
            {
                return LessonVideoHandler.Refused().ToHttp();
            }
            await using var stream = file.OpenReadStream();
            var (result, video) = await handler.UploadAsync(id, file.FileName, file.ContentType, file.Length, stream, ct);
            return video is not null ? Results.Created($"/curriculum/lessons/{id}/video", video) : result.ToHttp();
        }).DisableAntiforgery().WithMetadata(new RequestSizeLimitAttribute(LessonVideoOptions.DefaultMaxBytes + FormOverhead));
        curriculum.MapDelete("/lessons/{id:guid}/video", async (Guid id, LessonVideoHandler handler, CancellationToken ct) =>
            (await handler.RemoveAsync(id, ct)).ToHttp());
        return app;
    }
}
