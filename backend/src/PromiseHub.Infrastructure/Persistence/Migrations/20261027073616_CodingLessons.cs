using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CodingLessons : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "StarterCode",
                table: "Lessons",
                type: "TEXT",
                maxLength: 50000,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CodingSteps",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    LessonId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Position = table.Column<int>(type: "INTEGER", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    Instructions = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: false),
                    Sample = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: true),
                    CheckLabel = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CodingSteps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CodingSteps_Lessons_LessonId",
                        column: x => x.LessonId,
                        principalTable: "Lessons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CodingSteps_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CodingWorkspaces",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    MembershipId = table.Column<Guid>(type: "TEXT", nullable: false),
                    LessonId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Code = table.Column<string>(type: "TEXT", maxLength: 50000, nullable: false),
                    CheckedStepIds = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: false),
                    UpdatedAt = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CodingWorkspaces", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CodingWorkspaces_Lessons_LessonId",
                        column: x => x.LessonId,
                        principalTable: "Lessons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CodingWorkspaces_Memberships_MembershipId",
                        column: x => x.MembershipId,
                        principalTable: "Memberships",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CodingWorkspaces_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CodingSteps_LessonId",
                table: "CodingSteps",
                column: "LessonId");

            migrationBuilder.CreateIndex(
                name: "IX_CodingSteps_OrganizationId",
                table: "CodingSteps",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_CodingWorkspaces_LessonId",
                table: "CodingWorkspaces",
                column: "LessonId");

            migrationBuilder.CreateIndex(
                name: "IX_CodingWorkspaces_MembershipId_LessonId",
                table: "CodingWorkspaces",
                columns: new[] { "MembershipId", "LessonId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CodingWorkspaces_OrganizationId",
                table: "CodingWorkspaces",
                column: "OrganizationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CodingSteps");

            migrationBuilder.DropTable(
                name: "CodingWorkspaces");

            migrationBuilder.DropColumn(
                name: "StarterCode",
                table: "Lessons");
        }
    }
}
