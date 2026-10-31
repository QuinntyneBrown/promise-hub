namespace PromiseHub.Application.LearningBond;

/// <summary>
/// The platform's benefits catalogue (L2-155, ADR 0082): federal entries, a child benefit for every province and territory, and municipal
/// entries where the organization's city is known. The same for every organization; estimates come from these rules, never the model.
/// </summary>
public static class BenefitCatalogue
{
    private static readonly DateOnly July2026 = new(2026, 7, 1);

    public static readonly IReadOnlyList<BenefitCatalogueEntry> All =
    [
        new("canada-child-benefit", "Canada Child Benefit", BenefitLevel.Federal, null, null, BenefitChannel.Electronic, "Canada Revenue Agency",
            "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-child-benefit-overview.html", "2026-07", July2026,
            new(age => age < 6 ? 7997 : 6748, AlreadyGets: h => h.Answers.CcbNow == "Yes")),
        new("child-disability-benefit", "Child Disability Benefit", BenefitLevel.Federal, null, null, BenefitChannel.Electronic, "Canada Revenue Agency",
            "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/child-disability-benefit.html", "2026-07", July2026,
            new(_ => 3411, NotEligible: h => NoDisabilityCredit(h.Children.Select(c => c.FirstName).ToList()))),
        new("ontario-child-benefit", "Ontario Child Benefit", BenefitLevel.Provincial, "ON", null, BenefitChannel.Electronic, "Ontario Ministry of Children, Community and Social Services",
            "https://www.ontario.ca/page/ontario-child-benefit", "2026-07", July2026, new(_ => 840)),
        new("hamilton-recreation-assistance", "Hamilton Recreation Assistance", BenefitLevel.Municipal, "ON", "Hamilton", BenefitChannel.Form, "City of Hamilton",
            "https://www.hamilton.ca/things-do/recreation/recreation-fee-assistance", "2026-03", new(2026, 3, 1), new(null, Document: "proof of address"),
            SendTo: "recassist@hamilton.example or 71 Main St W, Hamilton"),
        Provincial("bc-family-benefit", "BC Family Benefit", "BC", "https://www2.gov.bc.ca/gov/content/family-social-supports/affordability/family-benefit"),
        Provincial("alberta-child-and-family-benefit", "Alberta Child and Family Benefit", "AB", "https://www.alberta.ca/alberta-child-and-family-benefit"),
        Provincial("saskatchewan-low-income-tax-credit", "Saskatchewan Low-Income Tax Credit", "SK", "https://www.saskatchewan.ca/residents/taxes-and-investments"),
        Provincial("manitoba-child-benefit", "Manitoba Child Benefit", "MB", "https://www.gov.mb.ca/fs/eia/mcb.html"),
        Provincial("quebec-family-allowance", "Family Allowance (Québec)", "QC", "https://www.retraitequebec.gouv.qc.ca/en/familles/allocation-famille"),
        Provincial("new-brunswick-child-tax-benefit", "New Brunswick Child Tax Benefit", "NB", "https://www2.gnb.ca/content/gnb/en/departments/finance.html"),
        Provincial("nova-scotia-child-benefit", "Nova Scotia Child Benefit", "NS", "https://novascotia.ca/coms/families/ns-child-benefit.html"),
        Provincial("pei-sales-tax-credit", "PEI Sales Tax Credit", "PE", "https://www.princeedwardisland.ca/en/topic/finance"),
        Provincial("newfoundland-child-benefit", "Newfoundland and Labrador Child Benefit", "NL", "https://www.gov.nl.ca/fin/tax-programs-incentives/personal/"),
        Provincial("yukon-child-benefit", "Yukon Child Benefit", "YT", "https://yukon.ca/en/yukon-child-benefit"),
        Provincial("nwt-child-benefit", "Northwest Territories Child Benefit", "NT", "https://www.fin.gov.nt.ca/en/services/child-benefit"),
        Provincial("nunavut-child-benefit", "Nunavut Child Benefit", "NU", "https://www.gov.nu.ca/finance"),
    ];

    public static BenefitCatalogueEntry? Named(string key) => All.FirstOrDefault(e => e.Key == key);

    /// <summary>Federal entries, the province's, and the municipality's when the city matches one (L2-155 criteria 1 and 3).</summary>
    public static IReadOnlyList<BenefitCatalogueEntry> For(string province, string city) =>
        [.. All.Where(e => e.Level == BenefitLevel.Federal || (e.Level == BenefitLevel.Provincial && e.Province == province)
            || (e.Level == BenefitLevel.Municipal && e.Province == province && MunicipalityOf(city) == e.Municipality))];

    /// <summary>"Hamilton" from "Hamilton, Ontario".</summary>
    public static string MunicipalityOf(string city) => city.Split(',')[0].Trim();

    public static bool KnowsLocal(string province, string city) =>
        All.Any(e => e.Level == BenefitLevel.Municipal && e.Province == province && e.Municipality == MunicipalityOf(city));

    private static BenefitCatalogueEntry Provincial(string key, string name, string province, string link) =>
        new(key, name, BenefitLevel.Provincial, province, null, BenefitChannel.Electronic, name, link, "2026-07", July2026, new(null));

    private static string NoDisabilityCredit(IReadOnlyList<string> children) => children.Count switch
    {
        0 => "No child in your household has an approved Disability Tax Credit certificate.",
        1 => $"{children[0]} has no approved Disability Tax Credit certificate.",
        2 => $"Neither {children[0]} nor {children[1]} has an approved Disability Tax Credit certificate.",
        _ => "None of your children has an approved Disability Tax Credit certificate.",
    };
}
