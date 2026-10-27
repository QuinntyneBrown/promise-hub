using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

/// <summary>
/// Work waiting for a mentor (L2-080, L2-081): the published curriculum of <see cref="LearningContent"/>, Nadia assigned to Daniel, and
/// helpers that send her Serve someone this week and take a Knowing Yourself quiz whose results a mentor approves.
/// </summary>
public sealed class MentorReviewWork(PromiseHubApiFactory factory)
{
    public static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    public static readonly Guid Hana = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "hana@harbourview.example");
    public static readonly Guid Samuel = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "samuel@northgate.example");
    public static readonly Guid Leo = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "leo@harbourview.example");
    public const string Reflection = "I stayed after tutoring to stack the chairs so Jaylen could lock up on time.";
    public static readonly byte[] Png = [137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82];

    public LearningContent Content { get; private set; } = null!;
    public Guid Assignment { get; private set; }

    public async Task<MentorReviewWork> BuildAsync()
    {
        Content = await new LearningContent(factory).BuildAsync();
        Assignment = await Content.AssignmentAsync(Content.Knowing);
        await AssignAsync(LearningContent.NadiaChild, Daniel);
        return this;
    }

    public async Task AssignAsync(Guid child, Guid mentor) =>
        Assert.Equal(HttpStatusCode.NoContent, (await factory.ClientFor(LearningContent.Marisol)
            .PutAsJsonAsync($"/programs/{LearningContent.Tutoring}/youth/{child}/mentor", new { mentorId = mentor })).StatusCode);

    /// <summary>Nadia submits Serve someone this week with her reflection and a photo.</summary>
    public async Task<Guid> SubmitAsync()
    {
        var form = new MultipartFormDataContent { { new StringContent(Reflection), "text" }, { new StringContent("true"), "attest" } };
        var photo = new ByteArrayContent(Png);
        photo.Headers.ContentType = new("image/png");
        form.Add(photo, "file", "stacked-chairs.png");
        var response = await factory.ClientFor(LearningContent.Nadia).PostAsync($"/learning/assignments/{Assignment}/submission", form);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
    }

    /// <summary>A Knowing Yourself quiz whose results a mentor approves, taken by Nadia: 75% (the multiple answer wrong) unless all right.</summary>
    public async Task<(Guid Quiz, Guid Attempt)> AwaitingQuizAsync(string title = "Knowing Yourself quiz", bool allRight = false)
    {
        var quiz = await Content.QuizAsync(Content.Knowing, title: title, attempts: null);
        Execute($"UPDATE Quizzes SET RequireApproval = 1 WHERE upper(Id) = upper('{quiz}')");
        return (quiz, await TakeAsync(quiz, allRight));
    }

    public async Task<Guid> TakeAsync(Guid quiz, bool allRight = false)
    {
        var nadia = factory.ClientFor(LearningContent.Nadia);
        await nadia.PostAsync($"/learning/lessons/{Content.Strengths}/complete", null);
        await nadia.PostAsync($"/learning/lessons/{Content.Values}/complete", null);
        var started = await (await nadia.PostAsync($"/learning/quizzes/{quiz}/attempts", null)).Content.ReadFromJsonAsync<JsonElement>();
        var q = started.GetProperty("questions").EnumerateArray().Select(x => x.GetProperty("id").GetGuid()).ToList();
        var attempt = started.GetProperty("attemptId").GetGuid();
        var answers = new object[]
        {
            new { questionId = q[0], choices = new[] { 1 } },
            new { questionId = q[1], choices = new[] { 1 } },
            new { questionId = q[2], choices = allRight ? new[] { 0, 2 } : new[] { 0 } },
            new { questionId = q[3], text = "others" },
        };
        Assert.Equal(HttpStatusCode.OK, (await nadia.PostAsJsonAsync($"/learning/attempts/{attempt}/submit", new { answers, position = 3 })).StatusCode);
        return attempt;
    }

    public void Execute(string sql)
    {
        using var connection = new SqliteConnection(factory.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.ExecuteNonQuery();
    }

    public List<string> Query(string sql)
    {
        using var connection = new SqliteConnection(factory.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        using var reader = command.ExecuteReader();
        var rows = new List<string>();
        while (reader.Read())
        {
            rows.Add(reader.IsDBNull(0) ? "" : reader.GetValue(0).ToString()!);
        }
        return rows;
    }
}
