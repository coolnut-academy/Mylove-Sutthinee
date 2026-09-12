/**
 * Performance Agreement (ว.PA) Business Logic
 * Suttinee Teacher Workspace — Apps Script Backend
 */

const PA = {
  getSections: function(year) {
    const y = String(year);
    return Sheets.getTable('PA_SECTIONS')
      .filter(s => String(s.year) === y && !s.archived)
      .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
  },

  getItems: function(year, sectionCode) {
    const y = String(year);
    let items = Sheets.getTable('PA_ITEMS')
      .filter(i => String(i.year) === y && !i.archived && i.published);

    if (sectionCode) {
      items = items.filter(i => String(i.section_code) === String(sectionCode));
    }
    return items.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
  },

  saveItem: function(item) {
    const itemId = item.id;
    if (itemId) {
      item.updated_at = new Date().toISOString();
      Sheets.updateRow('PA_ITEMS', 'id', itemId, item);
      return item;
    } else {
      item.id = Utils.generateId('pa_item');
      item.created_at = new Date().toISOString();
      item.updated_at = new Date().toISOString();
      item.published = true;
      item.archived = false;
      Sheets.appendRow('PA_ITEMS', item);
      return item;
    }
  },

  setPublished: function(id, published) {
    return Sheets.updateRow('PA_ITEMS', 'id', id, { published: published, updated_at: new Date().toISOString() });
  },

  archiveItem: function(id, archived) {
    return Sheets.updateRow('PA_ITEMS', 'id', id, { archived: archived, updated_at: new Date().toISOString() });
  },

  seedDefaultSections: function(year) {
    const defaultSections = [
      { code: "1.1", parent: "ด้านที่ 1", title: "1.1 การสร้างและหรือพัฒนาหลักสูตร", order: 1 },
      { code: "1.2", parent: "ด้านที่ 1", title: "1.2 การออกแบบการจัดการเรียนรู้", order: 2 },
      { code: "1.3", parent: "ด้านที่ 1", title: "1.3 การจัดกิจกรรมการเรียนรู้", order: 3 },
      { code: "1.4", parent: "ด้านที่ 1", title: "1.4 การสร้างและหรือพัฒนาสื่อนวัตกรรม", order: 4 },
      { code: "1.5", parent: "ด้านที่ 1", title: "1.5 การวัดและประเมินผลการเรียนรู้", order: 5 },
      { code: "1.6", parent: "ด้านที่ 1", title: "1.6 การศึกษา วิเคราะห์ วิจัยเพื่อแก้ปัญหา", order: 6 },
      { code: "1.7", parent: "ด้านที่ 1", title: "1.7 การจัดบรรยากาศที่ส่งเสริมผู้เรียน", order: 7 },
      { code: "1.8", parent: "ด้านที่ 1", title: "1.8 การอบรมคุณลักษณะที่ดีของผู้เรียน", order: 8 },
      { code: "2.1", parent: "ด้านที่ 2", title: "2.1 การจัดทำข้อมูลสารสนเทศผู้เรียน", order: 9 },
      { code: "2.2", parent: "ด้านที่ 2", title: "2.2 การดำเนินงานตามระบบดูแลช่วยเหลือ", order: 10 },
      { code: "2.3", parent: "ด้านที่ 2", title: "2.3 การปฏิบัติงานวิชาการและงานสถานศึกษา", order: 11 },
      { code: "2.4", parent: "ด้านที่ 2", title: "2.4 การประสานความร่วมมือกับผู้ปกครอง", order: 12 },
      { code: "3.1", parent: "ด้านที่ 3", title: "3.1 การพัฒนาตนเองอย่างเป็นระบบ", order: 13 },
      { code: "3.2", parent: "ด้านที่ 3", title: "3.2 การมีส่วนร่วมในการแลกเปลี่ยนเรียนรู้ (PLC)", order: 14 },
      { code: "3.3", parent: "ด้านที่ 3", title: "3.3 การนำความรู้ทักษะมาพัฒนานวัตกรรม", order: 15 },
      { code: "CHALLENGE", parent: "ส่วนที่ 2", title: "ข้อตกลงในการพัฒนางานประเด็นท้าทาย", order: 16 }
    ];

    defaultSections.forEach(sec => {
      Sheets.appendRow('PA_SECTIONS', {
        id: Utils.generateId('sec'),
        year: String(year),
        section_code: sec.code,
        parent_code: sec.parent,
        title: sec.title,
        description: '',
        sort_order: sec.order,
        published: true,
        archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });
  }
};
