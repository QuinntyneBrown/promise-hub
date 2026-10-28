using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Staff;

/// <summary>
/// What the directory and the record say about a set of memberships, read in a few queries: a youth's child's current programs or
/// a mentor's cohorts, the last successful sign-in by email, and (while Mentoring is on) a youth's mentor or a mentor's youth.
/// </summary>
public sealed class PersonDetails
{
    private readonly Dictionary<Guid, List<string>> _childPrograms = [];
    private readonly Dictionary<Guid, List<string>> _mentorPrograms = [];
    private readonly Dictionary<string, DateTimeOffset> _signIns = [];
    private readonly Dictionary<Guid, string> _youthMentor = [];
    private readonly Dictionary<Guid, List<string>> _mentorYouth = [];

    public static async Task<PersonDetails> LoadAsync(IPromiseHubDb db, IReadOnlyCollection<Membership> members, bool mentoring, CancellationToken cancellationToken)
    {
        var details = new PersonDetails();
        var childIds = members.Where(m => m.ChildId != null).Select(m => m.ChildId!.Value).ToList();
        var memberIds = members.Select(m => m.Id).ToList();
        var emails = members.Select(m => m.Email).ToList();
        foreach (var row in await (from e in db.Enrollments.AsNoTracking()
                                   join p in db.Programs.AsNoTracking() on e.ProgramId equals p.Id
                                   where childIds.Contains(e.ChildId) && e.EndedAt == null
                                   select new { e.ChildId, p.Name }).ToListAsync(cancellationToken))
        {
            Add(details._childPrograms, row.ChildId, row.Name);
        }
        var attempts = await db.SignInAttempts.AsNoTracking().Where(a => emails.Contains(a.Email) && a.Succeeded).Select(a => new { a.Email, a.At }).ToListAsync(cancellationToken);
        foreach (var a in attempts.GroupBy(a => a.Email))
        {
            details._signIns[a.Key] = a.Max(x => x.At);
        }
        if (mentoring)
        {
            foreach (var row in await (from c in db.CohortMentors.AsNoTracking()
                                       join p in db.Programs.AsNoTracking() on c.ProgramId equals p.Id
                                       where memberIds.Contains(c.MentorMembershipId)
                                       select new { c.MentorMembershipId, p.Name }).ToListAsync(cancellationToken))
            {
                Add(details._mentorPrograms, row.MentorMembershipId, row.Name);
            }
            foreach (var row in await (from y in db.YouthMentors.AsNoTracking()
                                       join m in db.Memberships.AsNoTracking() on y.MentorMembershipId equals m.Id
                                       where childIds.Contains(y.ChildId) && m.RemovedAt == null
                                       select new { y.ChildId, m.PersonName }).ToListAsync(cancellationToken))
            {
                details._youthMentor[row.ChildId] = row.PersonName;
            }
            foreach (var row in await (from y in db.YouthMentors.AsNoTracking()
                                       join c in db.Children.AsNoTracking() on y.ChildId equals c.Id
                                       where memberIds.Contains(y.MentorMembershipId)
                                       select new { y.MentorMembershipId, c.FirstName, c.LastName }).ToListAsync(cancellationToken))
            {
                Add(details._mentorYouth, row.MentorMembershipId, $"{row.FirstName} {row.LastName}");
            }
        }
        return details;
    }

    public IReadOnlyList<string> Programs(Membership m) =>
        [.. (m.ChildId is { } c ? _childPrograms.GetValueOrDefault(c) ?? [] : []).Concat(_mentorPrograms.GetValueOrDefault(m.Id) ?? []).Distinct().Order()];

    public DateTimeOffset? LastSignedIn(Membership m) => _signIns.TryGetValue(m.Email, out var at) ? at : null;

    public PersonMentoringDto Mentoring(Membership m) =>
        new(m.ChildId is { } c ? _youthMentor.GetValueOrDefault(c) : null, [.. (_mentorYouth.GetValueOrDefault(m.Id) ?? []).Order()]);

    private static void Add(Dictionary<Guid, List<string>> map, Guid key, string value)
    {
        if (!map.TryGetValue(key, out var list))
        {
            map[key] = list = [];
        }
        list.Add(value);
    }
}
