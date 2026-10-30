using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class LearningBondSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LearningBondSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Coverage = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    ProgramIds = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: false),
                    StatusRoles = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    SenderName = table.Column<string>(type: "TEXT", maxLength: 30, nullable: true),
                    UpdatedAt = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LearningBondSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LearningBondSettings_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LearningBondSettings_OrganizationId",
                table: "LearningBondSettings",
                column: "OrganizationId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LearningBondSettings");
        }
    }
}
