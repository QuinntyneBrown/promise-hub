using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

/// <summary>
/// Builds a published curriculum through the authoring API, as Marisol would (L2-066, L2-067): Leadership Foundations, followed by
/// After‑School Tutoring, with Knowing Yourself (two published lessons and a draft), Leading by Serving (needs Knowing Yourself; two
/// published lessons) and the draft Speaking Up; plus the draft track Digital Skills that no program follows. Nadia is enrolled in
/// Tutoring so she is placed.
/// </summary>
public sealed class LearningContent(PromiseHubApiFactory factory)
{
    public static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    public static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    public static readonly Guid Nadia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "nadia@harbourview.example");
    public static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");
    public static readonly Guid NadiaChild = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Nadia Haddad");

    public Guid Leadership { get; private set; }
    public Guid Digital { get; private set; }
    public Guid Knowing { get; private set; }
    public Guid Serving { get; private set; }
    public Guid Speaking { get; private set; }
    public Guid Strengths { get; private set; }
    public Guid Values { get; private set; }
    public Guid Circle { get; private set; }
    public Guid Towel { get; private set; }
    public Guid Line { get; private set; }
    public Guid Voice { get; private set; }

    public async Task<LearningContent> BuildAsync()
    {
        Leadership = await Created("/curriculum/tracks", new { name = "Leadership Foundations", description = "Growing as a leader at home, at school and in the cohort." });
        Digital = await Created("/curriculum/tracks", new { name = "Digital Skills" });
        Knowing = await Created("/curriculum/modules", new { trackId = Leadership, title = "Knowing Yourself" });
        Serving = await Created("/curriculum/modules", new { trackId = Leadership, title = "Leading by Serving" });
        Speaking = await Created("/curriculum/modules", new { trackId = Leadership, title = "Speaking Up" });
        await Ok(await Put($"/curriculum/modules/{Serving}", new { title = "Leading by Serving", prerequisiteModuleId = Knowing, anchor = "“The best leaders are the ones who carry the bags.”" }));
        Strengths = await Lesson(Knowing, "Your Strengths", 10, "Everyone is good at something.", publish: true);
        Values = await Lesson(Knowing, "What Matters to You", 12, "Values are the things you would stand up for.", publish: true);
        Circle = await Lesson(Knowing, "Your Circle", 15, null, publish: false);
        Towel = await Lesson(Serving, "Pick Up the Towel", 12, "Leading isn’t a title.", publish: true);
        Line = await Lesson(Serving, "Last in Line", 15, "The greatest serves.", publish: true);
        Voice = await Lesson(Speaking, "Finding Your Voice", 10, "Say it plainly.", publish: true);
        await Ok(await Put($"/curriculum/modules/{Knowing}/status", new { status = "Published" }));
        await Ok(await Put($"/curriculum/modules/{Serving}/status", new { status = "Published" }));
        await Ok(await Put($"/curriculum/tracks/{Leadership}/status", new { status = "Published" }));
        await Ok(await Put($"/curriculum/tracks/{Leadership}/cohorts", new { programIds = new[] { Tutoring } }));
        var enrolled = await factory.ClientFor(Tom).PostAsJsonAsync($"/programs/{Tutoring}/enrollments", new { childId = NadiaChild });
        Assert.True(enrolled.IsSuccessStatusCode, $"Enrolling answered {enrolled.StatusCode}");
        return this;
    }

    /// <summary>
    /// The published Knowing Yourself quiz on the whole module (L2-073): a multiple choice (B right), a true / false (False right), a
    /// multiple answer (A and C right) and a short answer accepting "others" or "other people", 70% to pass, 2 attempts unless given.
    /// </summary>
    public async Task<Guid> QuizAsync(Guid moduleId, Guid? lessonId = null, string title = "Knowing Yourself quiz", int? attempts = 2,
        string feedback = "ShowAnswers", bool shuffle = false, bool required = false, bool publish = true)
    {
        var id = await Created("/curriculum/quizzes", new { moduleId, lessonId, title });
        await Ok(await Put($"/curriculum/quizzes/{id}", new { title, lessonId, passMark = 70, attemptsAllowed = attempts, feedback, shuffle, requiredToComplete = required }));
        await Created($"/curriculum/quizzes/{id}/questions", new { text = "What did the captain do before the big game?", type = "MultipleChoice", options = new[] { "Gave the team talk", "Packed the kit bags for everyone", "Went home early" }, correct = new[] { 1 } });
        await Created($"/curriculum/quizzes/{id}/questions", new { text = "Leading is a title someone gives you.", type = "TrueFalse", correct = new[] { 1 } });
        await Created($"/curriculum/quizzes/{id}/questions", new { text = "Which of these are ways to pick up the towel?", type = "MultipleAnswer", options = new[] { "Help clear up after group", "Wait until someone asks you", "Check on someone who is new" }, correct = new[] { 0, 2 } });
        await Created($"/curriculum/quizzes/{id}/questions", new { text = "In one word, who does a servant leader put first?", type = "ShortAnswer", answers = new[] { "others", "other people" } });
        if (publish)
        {
            await Ok(await Put($"/curriculum/quizzes/{id}/status", new { status = "Published" }));
        }
        return id;
    }

    private async Task<Guid> Lesson(Guid moduleId, string title, int minutes, string? body, bool publish)
    {
        var id = await Created("/curriculum/lessons", new { moduleId, title });
        await Ok(await Put($"/curriculum/lessons/{id}", new
        {
            title,
            reading = "The captain and the kit bags",
            minutes,
            objectives = new[] { "Notice what needs doing" },
            body,
            prompts = new[] { "Who picked up the towel for you?" },
            leaderNotes = "Watch for youth who find it hard to accept help.",
        }));
        if (publish)
        {
            await Ok(await Put($"/curriculum/lessons/{id}/status", new { status = "Published" }));
        }
        return id;
    }

    private Task<HttpResponseMessage> Put(string path, object body) => factory.ClientFor(Marisol).PutAsJsonAsync(path, body);

    private static Task Ok(HttpResponseMessage response)
    {
        Assert.True(response.IsSuccessStatusCode, $"{response.RequestMessage?.RequestUri} answered {response.StatusCode}");
        return Task.CompletedTask;
    }

    private async Task<Guid> Created(string path, object body)
    {
        var response = await factory.ClientFor(Marisol).PostAsJsonAsync(path, body);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
    }
}
