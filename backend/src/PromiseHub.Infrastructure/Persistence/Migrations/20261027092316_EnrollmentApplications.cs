using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EnrollmentApplications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AppliedAs",
                table: "EnrollmentRequests",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "Guardian");

            migrationBuilder.AddColumn<string>(
                name: "Reason",
                table: "EnrollmentRequests",
                type: "TEXT",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferrerContact",
                table: "EnrollmentRequests",
                type: "TEXT",
                maxLength: 320,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferrerName",
                table: "EnrollmentRequests",
                type: "TEXT",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferrerOrganization",
                table: "EnrollmentRequests",
                type: "TEXT",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferrerRole",
                table: "EnrollmentRequests",
                type: "TEXT",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "SeasonConsent",
                table: "EnrollmentRequests",
                type: "INTEGER",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AppliedAs",
                table: "EnrollmentRequests");

            migrationBuilder.DropColumn(
                name: "Reason",
                table: "EnrollmentRequests");

            migrationBuilder.DropColumn(
                name: "ReferrerContact",
                table: "EnrollmentRequests");

            migrationBuilder.DropColumn(
                name: "ReferrerName",
                table: "EnrollmentRequests");

            migrationBuilder.DropColumn(
                name: "ReferrerOrganization",
                table: "EnrollmentRequests");

            migrationBuilder.DropColumn(
                name: "ReferrerRole",
                table: "EnrollmentRequests");

            migrationBuilder.DropColumn(
                name: "SeasonConsent",
                table: "EnrollmentRequests");
        }
    }
}
