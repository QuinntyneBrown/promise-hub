using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ProgramTrack : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "TrackId",
                table: "Programs",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Programs_TrackId",
                table: "Programs",
                column: "TrackId");

            migrationBuilder.AddForeignKey(
                name: "FK_Programs_Tracks_TrackId",
                table: "Programs",
                column: "TrackId",
                principalTable: "Tracks",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Programs_Tracks_TrackId",
                table: "Programs");

            migrationBuilder.DropIndex(
                name: "IX_Programs_TrackId",
                table: "Programs");

            migrationBuilder.DropColumn(
                name: "TrackId",
                table: "Programs");
        }
    }
}
