using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class GuardianEnrollment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EnrollmentSlug",
                table: "Programs",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "EnrollmentRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ProgramId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ChildId = table.Column<Guid>(type: "TEXT", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Position = table.Column<int>(type: "INTEGER", nullable: true),
                    SubmittedBy = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    SubmittedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EnrollmentRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EnrollmentRequests_Children_ChildId",
                        column: x => x.ChildId,
                        principalTable: "Children",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EnrollmentRequests_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EnrollmentRequests_Programs_ProgramId",
                        column: x => x.ProgramId,
                        principalTable: "Programs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EnrollmentSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ProgramId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Contact = table.Column<string>(type: "TEXT", maxLength: 320, nullable: false),
                    CodeHash = table.Column<string>(type: "TEXT", maxLength: 64, nullable: true),
                    CodeExpiresAt = table.Column<long>(type: "INTEGER", nullable: true),
                    FailedCodes = table.Column<int>(type: "INTEGER", nullable: false),
                    LockedUntil = table.Column<long>(type: "INTEGER", nullable: true),
                    TokenHash = table.Column<string>(type: "TEXT", maxLength: 64, nullable: true),
                    VerifiedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                    HouseholdId = table.Column<Guid>(type: "TEXT", nullable: true),
                    Draft = table.Column<string>(type: "TEXT", nullable: true),
                    SubmittedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EnrollmentSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EnrollmentSessions_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EnrollmentSessions_Programs_ProgramId",
                        column: x => x.ProgramId,
                        principalTable: "Programs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EnrollmentRequests_ChildId",
                table: "EnrollmentRequests",
                column: "ChildId");

            migrationBuilder.CreateIndex(
                name: "IX_EnrollmentRequests_OrganizationId",
                table: "EnrollmentRequests",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_EnrollmentRequests_ProgramId_Status",
                table: "EnrollmentRequests",
                columns: new[] { "ProgramId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_EnrollmentSessions_OrganizationId",
                table: "EnrollmentSessions",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_EnrollmentSessions_ProgramId",
                table: "EnrollmentSessions",
                column: "ProgramId");

            migrationBuilder.CreateIndex(
                name: "IX_EnrollmentSessions_TokenHash",
                table: "EnrollmentSessions",
                column: "TokenHash",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EnrollmentRequests");

            migrationBuilder.DropTable(
                name: "EnrollmentSessions");

            migrationBuilder.DropColumn(
                name: "EnrollmentSlug",
                table: "Programs");
        }
    }
}
