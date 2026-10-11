from sqlalchemy import text

from config.database import db


# =========================================================
# RESEQUENCE IDS AFTER DELETE
# =========================================================
#
# The application deletes rows using their normal integer
# primary key (no AUTOINCREMENT keyword is used anywhere in
# this project, so SQLite always assigns new rows an id of
# MAX(id) + 1).
#
# Business requirement:
# Whenever a row is deleted, every remaining row that had a
# bigger id must have its id shifted down by 1, so ids stay
# perfectly sequential (1, 2, 3, ...) with no gaps.
#
# Any other table that stores a foreign key pointing at this
# table must have that foreign key shifted the same way, or
# it would silently point at the wrong row after the shift.
#
# This function performs both the parent id shift and every
# requested child foreign key shift inside the SAME database
# transaction as the delete that triggered it. It must be
# called AFTER the row has been deleted (and flushed) and
# BEFORE db.session.commit().
# =========================================================

def resequence_after_delete(table_name, deleted_id, fk_updates=None):
    """
    table_name:
        Name of the SQL table whose primary key ("id") should
        be resequenced (e.g. "products").

    deleted_id:
        The id that was just deleted from that table.

    fk_updates:
        Optional list of (child_table, fk_column) tuples.
        Every row in child_table whose fk_column is greater
        than deleted_id will have fk_column decremented by 1,
        keeping it pointed at the correct (shifted) parent row.
    """

    fk_updates = fk_updates or []

    # -----------------------------------------------------
    # SHIFT CHILD FOREIGN KEYS FIRST
    # -----------------------------------------------------
    #
    # These are plain (non primary key) integer columns, so
    # there is no uniqueness constraint to worry about while
    # shifting them.
    # -----------------------------------------------------

    for child_table, fk_column in fk_updates:

        db.session.execute(
            text(
                f"UPDATE {child_table} "
                f"SET {fk_column} = {fk_column} - 1 "
                f"WHERE {fk_column} > :deleted_id"
            ),
            {"deleted_id": deleted_id}
        )

    # -----------------------------------------------------
    # SHIFT THE PARENT TABLE'S OWN IDS
    # -----------------------------------------------------
    #
    # Deleting id = k first, then decrementing every id > k
    # by 1 (in ascending order) never collides: the target
    # id (old_id - 1) is always a value that has just been
    # freed up (either it was k itself, or it was already
    # vacated by the previous row's shift).
    # -----------------------------------------------------

    db.session.execute(
        text(
            f"UPDATE {table_name} "
            f"SET id = id - 1 "
            f"WHERE id > :deleted_id"
        ),
        {"deleted_id": deleted_id}
    )

    # -----------------------------------------------------
    # DROP STALE OBJECTS FROM THE SESSION IDENTITY MAP
    # -----------------------------------------------------
    #
    # We just changed primary keys using raw SQL, bypassing
    # the ORM. Any model instances already loaded into this
    # session under their OLD id would otherwise be returned
    # from the identity map instead of being re-fetched.
    # -----------------------------------------------------

    db.session.expire_all()
