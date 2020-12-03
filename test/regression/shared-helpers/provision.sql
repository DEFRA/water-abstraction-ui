INSERT INTO idm.users(user_id, user_name, password, reset_required, application, role, date_created, date_updated,
                      external_id, enabled)
VALUES (505050, 'regression.tests@defra.gov.uk', '$2b$10$YJrZWaJ3dDyamlr6WNxVpufGg/uJDWgGxnuN9O4jpAEJQxS/pyp4O', 0,
        'water_admin', '{"scopes": ["internal"]}'::jsonb, now(), now(), '42511f57-0ccf-4f71-a574-43e6ed5ae978', true)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO idm.user_groups(user_group_id, user_id, group_id, date_created, date_updated)
VALUES (gen_random_uuid (), 505050, SELECT(group_id) FROM idm.groups WHERE group = 'super' LIMIT 1, now(), now())
