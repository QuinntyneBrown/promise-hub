using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Slips : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AskLunch",
                table: "PermissionSlips",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AskPhotos",
                table: "PermissionSlips",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AskSwimming",
                table: "PermissionSlips",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Body",
                table: "PermissionSlips",
                type: "TEXT",
                maxLength: 600,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Channel",
                table: "PermissionSlips",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "MessageId",
                table: "PermissionSlips",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Reminders",
                table: "PermissionSlips",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<long>(
                name: "ScheduledFor",
                table: "PermissionSlips",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "SentAt",
                table: "PermissionSlips",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "PermissionSlips",
                type: "TEXT",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Version",
                table: "PermissionSlips",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Source",
                table: "Messages",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "SlipSignatures",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    SlipId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ChildId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Version = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    SignedBy = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    At = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SlipSignatures", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SlipSignatures_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SlipSignatures_PermissionSlips_SlipId",
                        column: x => x.SlipId,
                        principalTable: "PermissionSlips",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SlipSignatures_OrganizationId",
                table: "SlipSignatures",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_SlipSignatures_SlipId_ChildId",
                table: "SlipSignatures",
                columns: new[] { "SlipId", "ChildId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SlipSignatures");

            migrationBuilder.DropColumn(
                name: "AskLunch",
                table: "PermissionSlips");

            migrationBuilder.DropColumn(
                name: "AskPhotos",
                table: "PermissionSlips");

            migrationBuilder.DropColumn(
                name: "AskSwimming",
                table: "PermissionSlips");

            migrationBuilder.DropColumn(
                name: "Body",
                table: "PermissionSlips");

            migrationBuilder.DropColumn(
                name: "Channel",
                table: "PermissionSlips");

            migrationBuilder.DropColumn(
                name: "MessageId",
                table: "PermissionSlips");

            migrationBuilder.DropColumn(
                name: "Reminders",
                table: "PermissionSlips");

            migrationBuilder.DropColumn(
                name: "ScheduledFor",
                table: "PermissionSlips");

            migrationBuilder.DropColumn(
                name: "SentAt",
                table: "PermissionSlips");

            migrationBuilder.DropColumn(
                name: "Title",
                table: "PermissionSlips");

            migrationBuilder.DropColumn(
                name: "Version",
                table: "PermissionSlips");

            migrationBuilder.DropColumn(
                name: "Source",
                table: "Messages");
        }
    }
}
