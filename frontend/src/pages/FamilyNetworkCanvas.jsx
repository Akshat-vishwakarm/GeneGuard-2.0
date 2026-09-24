import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Plus, 
  Trash2, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  FileText, 
  Check, 
  X, 
  AlertCircle, 
  Dna, 
  ChevronRight,
  Shield,
  HelpCircle,
  Activity,
  Edit2
} from 'lucide-react';

// Specialized SVG Icons matching the reference image
const MaleIcon = ({ size = 28, color = '#3B82F6' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="14" r="5" />
    <path d="M19 5l-5.4 5.4" />
    <path d="M19 5h-5" />
    <path d="M19 5v5" />
  </svg>
);

const FemaleIcon = ({ size = 28, color = '#EC4899' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="9" r="5" />
    <path d="M12 14v7" />
    <path d="M9 18h6" />
  </svg>
);

const GamepadIcon = ({ size = 28, color = '#10B981' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="6" />
    <path d="M6 12h4" />
    <path d="M8 10v4" />
    <circle cx="15" cy="11" r="1" fill={color} />
    <circle cx="17" cy="13" r="1" fill={color} />
  </svg>
);

const ElderIcon = ({ size = 28, color = '#F59E0B' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="4" r="2" fill={color} />
    <path d="M7 10c0-1.7 1.3-3 3-3h2c1.7 0 3 1.3 3 3v4l-2 3v4" />
    <path d="M9 14l-2 7" />
    <path d="M18 9c0-1-.7-1.5-1.5-1.5S15 8 15 9v12" strokeWidth="2" />
  </svg>
);

const UserCenterIcon = ({ size = 32, color = '#38BDF8' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="7" r="4" />
    <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
  </svg>
);

// Core 5 diseases for Family Risk Engine 3-state evaluation
export const CORE_FAMILY_CONDITIONS = [
  { key: 'diabetes', label: 'Diabetes', category: 'Metabolic' },
  { key: 'hypertension', label: 'Hypertension', category: 'Blood Pressure' },
  { key: 'cardiovascular', label: 'Heart Disease', category: 'Cardiovascular' },
  { key: 'thyroid', label: 'Thyroid Disease', category: 'Endocrine' },
  { key: 'cancer', label: 'Cancer', category: 'Oncology' }
];

// Common conditions available to pick for family members (legacy fallback)
const AVAILABLE_CONDITIONS = [
  'Hypertension',
  'Diabetes',
  'Thyroid Disorder',
  'Heart Disease',
  'Stroke',
  'Cancer',
  'Kidney Disease',
  'Asthma / COPD'
];

// Helper: Determine if relative is Male (Upper Tier) or Female (Lower Tier)
export const isMaleRelative = (member) => {
  if (!member) return false;
  const sex = (member.sex || '').toLowerCase();
  if (sex === 'male' || sex === 'm') return true;
  if (sex === 'female' || sex === 'f') return false;
  const rel = (member.relationship || '').toLowerCase();
  return ['father', 'brother', 'grandfather', 'paternal grandfather', 'maternal grandfather', 'son', 'uncle', 'nephew'].some((r) => rel.includes(r));
};

// Canonical Gender-Partitioned Positions
// ALL MALES -> UPPER TIER (y < 300)
// ALL FEMALES -> LOWER TIER (y > 300)
// CENTER -> ME (y = 300)
const CANONICAL_DEFAULTS = {
  me: { x: 430, y: 300 },
  // Upper Tier (Males)
  brother: { x: 110, y: 140 },
  father: { x: 740, y: 140 },
  grandfather_paternal: { x: 1040, y: 80 },
  grandfather_maternal: { x: 1040, y: 200 },
  // Lower Tier (Females)
  mother: { x: 740, y: 440 },
  sister: { x: 110, y: 440 },
  grandmother_maternal: { x: 1040, y: 440 },
  grandmother_paternal: { x: 1040, y: 560 }
};

// Node visual theme configuration matching reference image
const NODE_THEMES = {
  me: {
    color: '#38BDF8',
    gradientBorder: 'linear-gradient(135deg, #38BDF8, #A855F7)',
    glow: 'rgba(56, 189, 248, 0.45)',
    icon: (c) => <UserCenterIcon color={c || '#38BDF8'} size={34} />,
    defaultX: CANONICAL_DEFAULTS.me.x,
    defaultY: CANONICAL_DEFAULTS.me.y,
    width: 175,
    height: 115
  },
  father: {
    color: '#3B82F6',
    glow: 'rgba(59, 130, 246, 0.45)',
    icon: (c) => <MaleIcon color={c || '#3B82F6'} size={30} />,
    defaultX: CANONICAL_DEFAULTS.father.x,
    defaultY: CANONICAL_DEFAULTS.father.y,
    width: 155,
    height: 100
  },
  mother: {
    color: '#EC4899',
    glow: 'rgba(236, 72, 153, 0.45)',
    icon: (c) => <FemaleIcon color={c || '#EC4899'} size={30} />,
    defaultX: CANONICAL_DEFAULTS.mother.x,
    defaultY: CANONICAL_DEFAULTS.mother.y,
    width: 155,
    height: 100
  },
  brother: {
    color: '#10B981',
    glow: 'rgba(16, 185, 129, 0.45)',
    icon: (c) => <GamepadIcon color={c || '#10B981'} size={30} />,
    defaultX: CANONICAL_DEFAULTS.brother.x,
    defaultY: CANONICAL_DEFAULTS.brother.y,
    width: 155,
    height: 100
  },
  grandfather_paternal: {
    color: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.45)',
    icon: (c) => <ElderIcon color={c || '#F59E0B'} size={30} />,
    defaultX: CANONICAL_DEFAULTS.grandfather_paternal.x,
    defaultY: CANONICAL_DEFAULTS.grandfather_paternal.y,
    width: 175,
    height: 100
  },
  grandfather_maternal: {
    color: '#8B5CF6',
    glow: 'rgba(139, 92, 246, 0.45)',
    icon: (c) => <ElderIcon color={c || '#8B5CF6'} size={30} />,
    defaultX: CANONICAL_DEFAULTS.grandfather_maternal.x,
    defaultY: CANONICAL_DEFAULTS.grandfather_maternal.y,
    width: 175,
    height: 100
  },
  generic_female: {
    color: '#F43F5E',
    glow: 'rgba(244, 63, 94, 0.4)',
    icon: (c) => <FemaleIcon color={c || '#F43F5E'} size={28} />,
    width: 160,
    height: 100
  },
  generic_male: {
    color: '#06B6D4',
    glow: 'rgba(6, 182, 212, 0.4)',
    icon: (c) => <MaleIcon color={c || '#06B6D4'} size={28} />,
    width: 160,
    height: 100
  }
};

export default function FamilyNetworkCanvas({
  selfData,
  familyMembers,
  setFamilyMembers,
  onBackToInput,
  onGenerateFinalAnalysis,
  onOpenReportUpload
}) {
  const containerRef = useRef(null);
  const [selectedNodeId, setSelectedNodeId] = useState('me');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Pan & Zoom state
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Dragging state for nodes
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Node Positions (starts with ONLY 'me' in clean fresh state, no localStorage persistence)
  const [nodePositions, setNodePositions] = useState({
    me: { x: 550, y: 300 }
  });

  // Selected node object
  const selectedNode = selectedNodeId === 'me' 
    ? {
        person_id: 'me',
        name: selfData.name || 'Me',
        relationship: 'Self',
        sex: selfData.gender === 'female' ? 'Female' : 'Male',
        age: selfData.age,
        conditions: selfData.conditions || [],
        is_self: true
      }
    : familyMembers.find((m) => m.person_id === selectedNodeId);

  // Node theme helper
  const getNodeTheme = (memberId, member) => {
    if (memberId === 'me') return NODE_THEMES.me;
    if (memberId === 'father') return NODE_THEMES.father;
    if (memberId === 'mother') return NODE_THEMES.mother;
    if (memberId === 'brother') return NODE_THEMES.brother;
    if (memberId === 'grandfather_paternal') return NODE_THEMES.grandfather_paternal;
    if (memberId === 'grandfather_maternal') return NODE_THEMES.grandfather_maternal;

    const rel = (member?.relationship || '').toLowerCase();
    const isMale = isMaleRelative(member);

    if (isMale) return NODE_THEMES.generic_male;
    return NODE_THEMES.generic_female;
  };

  // Node position helper
  const getPos = (id) => {
    if (nodePositions[id]) return nodePositions[id];
    // Dynamic fallback: Upper for males, Lower for females
    return { x: 500, y: 300 };
  };

  // Reset / Auto-Arrange Layout (Enforces All Males in Upper Tier, All Females in Lower Tier)
  const handleAutoArrange = () => {
    const updated = {
      me: { ...CANONICAL_DEFAULTS.me }
    };

    // Partition members into males and females
    const males = familyMembers.filter((m) => isMaleRelative(m));
    const females = familyMembers.filter((m) => !isMaleRelative(m));

    // Place Males in UPPER tier (y < 300)
    males.forEach((m) => {
      if (m.person_id === 'father') updated.father = { ...CANONICAL_DEFAULTS.father };
      else if (m.person_id === 'brother') updated.brother = { ...CANONICAL_DEFAULTS.brother };
      else if (m.person_id === 'grandfather_paternal') updated.grandfather_paternal = { ...CANONICAL_DEFAULTS.grandfather_paternal };
      else if (m.person_id === 'grandfather_maternal') updated.grandfather_maternal = { ...CANONICAL_DEFAULTS.grandfather_maternal };
      else {
        const rel = (m.relationship || '').toLowerCase();
        if (rel.includes('brother') || rel.includes('sibling')) {
          updated[m.person_id] = { x: 110, y: 80 };
        } else if (rel.includes('son')) {
          updated[m.person_id] = { x: 280, y: 140 };
        } else if (rel.includes('grandfather')) {
          updated[m.person_id] = { x: 1220, y: 140 };
        } else {
          updated[m.person_id] = { x: 740 + Object.keys(updated).length * 30, y: 140 };
        }
      }
    });

    // Place Females in LOWER tier (y > 300)
    females.forEach((m) => {
      if (m.person_id === 'mother') updated.mother = { ...CANONICAL_DEFAULTS.mother };
      else {
        const rel = (m.relationship || '').toLowerCase();
        if (rel.includes('sister') || rel.includes('sibling')) {
          updated[m.person_id] = { x: 110, y: 440 };
        } else if (rel.includes('daughter')) {
          updated[m.person_id] = { x: 280, y: 460 };
        } else if (rel.includes('grandmother')) {
          const isPaternal = rel.includes('paternal');
          updated[m.person_id] = { x: 1040, y: isPaternal ? 560 : 440 };
        } else {
          updated[m.person_id] = { x: 740 + Object.keys(updated).length * 30, y: 440 };
        }
      }
    });

    setNodePositions(updated);
    setPan({ x: 0, y: 0 });
    setScale(1);
  };

  // Fit View
  const handleFitView = () => {
    setPan({ x: 40, y: 20 });
    setScale(0.88);
  };

  // Pan handlers
  const handleMouseDown = (e) => {
    if (e.target.dataset.canvasBackground === 'true' || e.target.tagName === 'svg') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    } else if (draggingNodeId) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const rawX = (e.clientX - containerRect.left - pan.x) / scale;
      const rawY = (e.clientY - containerRect.top - pan.y) / scale;

      setNodePositions((prev) => ({
        ...prev,
        [draggingNodeId]: {
          x: Math.round(rawX - dragOffset.x),
          y: Math.round(rawY - dragOffset.y)
        }
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Node Drag Start
  const handleNodeDragStart = (e, nodeId) => {
    e.stopPropagation();
    const pos = getPos(nodeId);
    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseCanvasX = (e.clientX - containerRect.left - pan.x) / scale;
    const mouseCanvasY = (e.clientY - containerRect.top - pan.y) / scale;

    setDraggingNodeId(nodeId);
    setDragOffset({
      x: mouseCanvasX - pos.x,
      y: mouseCanvasY - pos.y
    });
  };

  // Node Click
  const handleNodeClick = (nodeId) => {
    setSelectedNodeId(nodeId);
    setIsDrawerOpen(true);
  };

  // Initial Add Family Member Form State: All conditions default strictly to UNKNOWN (null)
  const INITIAL_NEW_MEMBER_FORM = {
    relationship: 'Father',
    name: '',
    age: '',
    sex: 'Male',
    family_conditions: {
      diabetes: null,
      hypertension: null,
      cardiovascular: null,
      thyroid: null,
      cancer: null
    }
  };

  const [newMemberForm, setNewMemberForm] = useState(INITIAL_NEW_MEMBER_FORM);
  const isNewMemberMale = newMemberForm.sex === 'Male';

  // Smart Coordinate Generator: Strictly places Males in Upper Tier and Females in Lower Tier
  const handleAddMemberSubmit = (e) => {
    e.preventDefault();
    const id = `member_${Date.now()}`;
    const displayName = newMemberForm.name.trim() || newMemberForm.relationship;
    const isMale = newMemberForm.sex === 'Male';

    const activeConditions = CORE_FAMILY_CONDITIONS
      .filter((c) => newMemberForm.family_conditions[c.key] === 1)
      .map((c) => c.label);

    const newMember = {
      person_id: id,
      name: displayName,
      relationship: newMemberForm.relationship,
      sex: newMemberForm.sex,
      age: newMemberForm.age ? parseInt(newMemberForm.age) : null,
      conditions: activeConditions,
      family_conditions: { ...newMemberForm.family_conditions },
      age_at_diagnosis: {},
      history_unknown: Object.values(newMemberForm.family_conditions).every((v) => v === null)
    };

    const mePos = getPos('me');
    let newX = mePos.x + 280;
    let newY = 140;

    const rel = newMemberForm.relationship.toLowerCase();

    if (isMale) {
      // UPPER TIER: y strictly between 80 and 200
      if (rel.includes('brother') || rel.includes('sibling')) {
        newX = mePos.x - 280;
        newY = 140;
      } else if (rel.includes('paternal') && rel.includes('grand')) {
        newX = mePos.x + 580;
        newY = 100;
      } else if (rel.includes('maternal') && rel.includes('grand')) {
        newX = mePos.x + 580;
        newY = 200;
      } else if (rel.includes('grandfather')) {
        newX = mePos.x + 580;
        newY = 140;
      } else if (rel.includes('son')) {
        newX = mePos.x - 140;
        newY = 120;
      } else if (rel === 'father') {
        newX = mePos.x + 280;
        newY = 140;
      } else {
        const maleCount = familyMembers.filter((m) => isMaleRelative(m)).length;
        newX = mePos.x + 280 + (maleCount * 140);
        newY = 140;
      }
    } else {
      // LOWER TIER: y strictly between 420 and 560
      if (rel.includes('sister') || rel.includes('sibling')) {
        newX = mePos.x - 280;
        newY = 440;
      } else if (rel.includes('paternal') && rel.includes('grand')) {
        newX = mePos.x + 580;
        newY = 440;
      } else if (rel.includes('maternal') && rel.includes('grand')) {
        newX = mePos.x + 580;
        newY = 540;
      } else if (rel.includes('grandmother')) {
        newX = mePos.x + 580;
        newY = 480;
      } else if (rel.includes('daughter')) {
        newX = mePos.x - 140;
        newY = 460;
      } else if (rel === 'mother') {
        newX = mePos.x + 280;
        newY = 440;
      } else {
        const femaleCount = familyMembers.filter((m) => !isMaleRelative(m)).length;
        newX = mePos.x + 280 + (femaleCount * 140);
        newY = 440;
      }
    }

    setNodePositions((prev) => ({
      ...prev,
      [id]: { x: newX, y: newY }
    }));

    setFamilyMembers((prev) => [...prev, newMember]);
    setNewMemberForm(INITIAL_NEW_MEMBER_FORM);
    setIsAddModalOpen(false);
    setSelectedNodeId(id);
    setIsDrawerOpen(true);
  };

  // Delete Member (not self)
  const handleDeleteMember = (memberId) => {
    if (memberId === 'me') return;
    setFamilyMembers((prev) => prev.filter((m) => m.person_id !== memberId));
    setIsDrawerOpen(false);
    setSelectedNodeId('me');
  };

  // Update Member in Drawer
  const handleUpdateMember = (updatedMember) => {
    setFamilyMembers((prev) =>
      prev.map((m) => (m.person_id === updatedMember.person_id ? updatedMember : m))
    );
  };

  // Dynamic Connections list: ONLY creates lines for members that actually exist!
  const connections = [];

  familyMembers.forEach((member) => {
    const isMale = isMaleRelative(member);
    const rel = (member.relationship || '').toLowerCase();
    const pid = member.person_id;

    if (rel.includes('paternal') && rel.includes('grand')) {
      const fatherMember = familyMembers.find((m) => (m.relationship || '').toLowerCase() === 'father');
      if (fatherMember) {
        connections.push({
          fromId: fatherMember.person_id,
          toId: pid,
          fromPort: 'right',
          toPort: 'left',
          color: '#3B82F6',
          targetColor: isMale ? '#F59E0B' : '#EC4899',
          straight: true
        });
        return;
      }
    }

    if (rel.includes('maternal') && rel.includes('grand')) {
      const motherMember = familyMembers.find((m) => (m.relationship || '').toLowerCase() === 'mother');
      if (motherMember) {
        connections.push({
          fromId: motherMember.person_id,
          toId: pid,
          fromPort: isMale ? 'right_top' : 'right_bottom',
          toPort: 'left',
          color: '#EC4899',
          targetColor: isMale ? '#8B5CF6' : '#F43F5E',
          curve: isMale ? 'up_right' : 'down_right'
        });
        return;
      }
    }

    if (rel.includes('brother') || (isMale && rel.includes('sibling'))) {
      connections.push({
        fromId: 'me',
        toId: pid,
        fromPort: 'left_top',
        toPort: 'right',
        color: '#38BDF8',
        targetColor: '#10B981',
        curve: 'up_left'
      });
      return;
    }

    if (rel.includes('sister') || (!isMale && rel.includes('sibling'))) {
      connections.push({
        fromId: 'me',
        toId: pid,
        fromPort: 'left_bottom',
        toPort: 'right',
        color: '#38BDF8',
        targetColor: '#F43F5E',
        curve: 'down_left'
      });
      return;
    }

    if (rel === 'father') {
      connections.push({
        fromId: 'me',
        toId: pid,
        fromPort: 'right_top',
        toPort: 'left',
        color: '#38BDF8',
        targetColor: '#3B82F6',
        curve: 'up_right'
      });
      return;
    }

    if (rel === 'mother') {
      connections.push({
        fromId: 'me',
        toId: pid,
        fromPort: 'right_bottom',
        toPort: 'left',
        color: '#38BDF8',
        targetColor: '#EC4899',
        curve: 'down_right'
      });
      return;
    }

    connections.push({
      fromId: 'me',
      toId: pid,
      fromPort: isMale ? 'right_top' : 'right_bottom',
      toPort: 'left',
      color: '#38BDF8',
      targetColor: isMale ? '#3B82F6' : '#EC4899',
      curve: isMale ? 'up_right' : 'down_right'
    });
  });

  // Calculate connection points & SVG path
  const renderPath = (conn, index) => {
    const fromPos = getPos(conn.fromId);
    const toPos = getPos(conn.toId);

    const fromTheme = getNodeTheme(conn.fromId);
    const toTheme = getNodeTheme(conn.toId);

    const fromW = fromTheme.width || 160;
    const fromH = fromTheme.height || 100;
    const toW = toTheme.width || 160;
    const toH = toTheme.height || 100;

    let startX = fromPos.x + fromW;
    let startY = fromPos.y + fromH / 2;

    if (conn.fromPort === 'left') {
      startX = fromPos.x;
      startY = fromPos.y + fromH / 2;
    } else if (conn.fromPort === 'left_top') {
      startX = fromPos.x;
      startY = fromPos.y + fromH * 0.32;
    } else if (conn.fromPort === 'left_bottom') {
      startX = fromPos.x;
      startY = fromPos.y + fromH * 0.68;
    } else if (conn.fromPort === 'right_top') {
      startX = fromPos.x + fromW;
      startY = fromPos.y + fromH * 0.32;
    } else if (conn.fromPort === 'right_bottom') {
      startX = fromPos.x + fromW;
      startY = fromPos.y + fromH * 0.68;
    }

    let endX = toPos.x;
    let endY = toPos.y + toH / 2;

    if (conn.toPort === 'right') {
      endX = toPos.x + toW;
      endY = toPos.y + toH / 2;
    }

    let d = '';
    const dx = Math.abs(endX - startX);

    if (conn.straight && Math.abs(startY - endY) < 15) {
      d = `M ${startX} ${startY} L ${endX} ${endY}`;
    } else {
      // Smooth Cubic Bezier
      const cp1X = startX + (endX > startX ? dx * 0.5 : -dx * 0.5);
      const cp1Y = startY;
      const cp2X = startX + (endX > startX ? dx * 0.5 : -dx * 0.5);
      const cp2Y = endY;
      d = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
    }

    return (
      <g key={`conn_${conn.fromId}_${conn.toId}_${index}`}>
        {/* Thin subtle grey connector line */}
        <path
          d={d}
          fill="none"
          stroke="rgba(255, 255, 255, 0.16)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Small port circle at origin */}
        <circle
          cx={startX}
          cy={startY}
          r="3"
          fill="#444444"
          stroke="#000000"
          strokeWidth="1.5"
        />

        {/* Small port circle at destination */}
        <circle
          cx={endX}
          cy={endY}
          r="3"
          fill="#444444"
          stroke="#000000"
          strokeWidth="1.5"
        />
      </g>
    );
  };

  // All nodes to display
  const allNodes = [
    {
      id: 'me',
      isMe: true,
      title: selfData.name || 'Patient',
      subtitle: selfData.name ? 'Patient' : 'Self',
      theme: NODE_THEMES.me,
      age: selfData.age,
      conditions: selfData.conditions || []
    },
    ...familyMembers.map((member) => ({
      id: member.person_id,
      isMe: false,
      title: member.relationship,
      subtitle: member.name,
      theme: getNodeTheme(member.person_id, member),
      age: member.age,
      conditions: member.conditions || [],
      memberObj: member
    }))
  ];

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 120px)', minHeight: '680px', overflow: 'hidden', background: 'rgba(0, 0, 0, 0.20)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
      
      {/* TOP TOOLBAR */}
      <div 
        style={{
          position: 'absolute',
          top: '16px',
          left: '20px',
          right: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 30,
          pointerEvents: 'none'
        }}
      >
        {/* Left Toolbar Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', pointerEvents: 'auto' }}>
          <button
            className="btn btn-secondary"
            onClick={onBackToInput}
            style={{ 
              background: 'rgba(0, 0, 0, 0.35)', 
              border: '1px solid rgba(255, 255, 255, 0.08)', 
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              padding: '7px 14px',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)'
            }}
          >
            <span>&larr; My Health Profile</span>
          </button>

          <div style={{
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-md)',
            padding: '6px 14px',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)'
          }}>
            <Dna size={14} color="var(--accent-cyan)" />
            <span>Family Network: <strong style={{ color: '#FFFFFF' }}>{allNodes.length} Members</strong></span>
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => setIsAddModalOpen(true)}
            style={{ 
              background: 'rgba(0, 0, 0, 0.35)', 
              border: '1px solid rgba(255, 255, 255, 0.08)', 
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              padding: '7px 14px',
              fontSize: '0.82rem',
              color: 'var(--text-primary)'
            }}
          >
            <Plus size={14} />
            <span>Add Member</span>
          </button>
        </div>

        {/* Center / Right Toolbar Group: Controls & Primary CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', pointerEvents: 'auto' }}>
          {/* Zoom & Layout controls */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-md)',
            padding: '3px',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            gap: '2px'
          }}>
            <button
              onClick={() => setScale((s) => Math.min(s + 0.15, 1.8))}
              title="Zoom In"
              style={{ background: 'transparent', border: 'none', color: '#888888', padding: '6px', cursor: 'pointer', borderRadius: '4px', display: 'flex' }}
            >
              <ZoomIn size={15} />
            </button>
            <button
              onClick={() => setScale((s) => Math.max(s - 0.15, 0.5))}
              title="Zoom Out"
              style={{ background: 'transparent', border: 'none', color: '#888888', padding: '6px', cursor: 'pointer', borderRadius: '4px', display: 'flex' }}
            >
              <ZoomOut size={15} />
            </button>
            <button
              onClick={handleFitView}
              title="Fit View"
              style={{ background: 'transparent', border: 'none', color: '#888888', padding: '6px', cursor: 'pointer', borderRadius: '4px', display: 'flex' }}
            >
              <Maximize2 size={15} />
            </button>
            <button
              onClick={handleAutoArrange}
              title="Reset Gender-Partitioned Layout (Males Upper / Females Lower)"
              style={{ background: 'transparent', border: 'none', color: '#888888', padding: '6px', cursor: 'pointer', borderRadius: '4px', display: 'flex' }}
            >
              <RotateCcw size={15} />
            </button>
          </div>

          {/* HIGH VISIBILITY PRIMARY CTA */}
          <button
            onClick={onGenerateFinalAnalysis}
            style={{
              padding: '9px 20px',
              borderRadius: 'var(--radius-md)',
              background: '#FFFFFF',
              color: '#000000',
              fontWeight: 600,
              fontSize: '0.86rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: 'none',
              transition: 'opacity 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            <Dna size={16} />
            <span>Generate Final Analysis</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* AMBIENT GENDER LINEAGE WATERMARKS */}
      <div style={{
        position: 'absolute',
        top: '68px',
        left: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.72rem',
        fontWeight: 700,
        color: 'rgba(59, 130, 246, 0.55)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 15
      }}>
        <span style={{ fontSize: '1rem' }}>♂</span>
        <span>Male Relatives &bull; Upper Tier</span>
      </div>

      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.72rem',
        fontWeight: 700,
        color: 'rgba(236, 72, 153, 0.55)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 15
      }}>
        <span style={{ fontSize: '1rem' }}>♀</span>
        <span>Female Relatives &bull; Lower Tier</span>
      </div>

      {/* CANVAS WORKSPACE (PITCH BLACK #000000) */}
      <div
        ref={containerRef}
        data-canvas-background="true"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          width: '100%',
          height: '100%',
          cursor: isPanning ? 'grabbing' : 'grab',
          position: 'relative',
          userSelect: 'none',
          overflow: 'hidden'
        }}
      >
        {/* Transform Container with Pan & Zoom */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            transition: isPanning || draggingNodeId ? 'none' : 'transform 0.15s ease-out'
          }}
        >
          {/* SVG Connection Layer with Dividing Centerline */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '2400px',
              height: '1800px',
              pointerEvents: 'none',
              overflow: 'visible'
            }}
          >
            {/* Subtle dividing line separating Upper (Male) and Lower (Female) */}
            <line
              x1="0"
              y1="357"
              x2="2400"
              y2="357"
              stroke="rgba(255, 255, 255, 0.04)"
              strokeWidth="1.5"
              strokeDasharray="6 6"
            />

            {connections.map((conn, idx) => renderPath(conn, idx))}
          </svg>

          {/* Interactive Nodes */}
          {/* Inviting Empty State Prompt when Tree is Fresh */}
          {familyMembers.length === 0 && (
            <div
              style={{
                position: 'absolute',
                left: `${(nodePositions.me?.x || 550) - 20}px`,
                top: `${(nodePositions.me?.y || 300) + 130}px`,
                width: '260px',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: '14px',
                padding: '16px 18px',
                textAlign: 'center',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
                zIndex: 15
              }}
            >
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '4px' }}>
                Build your family network
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.4 }}>
                Add biological parents, siblings, or grandparents to evaluate hereditary risk.
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="btn btn-primary"
                style={{
                  fontSize: '0.82rem',
                  padding: '7px 14px',
                  width: '100%',
                  justifyContent: 'center',
                  background: '#FFFFFF',
                  color: '#000000',
                  border: 'none',
                  fontWeight: 600
                }}
              >
                <Plus size={14} />
                <span>+ Add Family Member</span>
              </button>
            </div>
          )}

          {allNodes.map((node) => {
            const pos = getPos(node.id);
            const isSelected = selectedNodeId === node.id;
            const theme = node.theme;
            const width = theme.width || 160;
            const height = theme.height || 100;
            const hasConditions = (node.conditions || []).length > 0;

            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleNodeDragStart(e, node.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNodeClick(node.id);
                }}
                style={{
                  position: 'absolute',
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  width: `${width}px`,
                  height: `${height}px`,
                  borderRadius: '14px',
                  background: isSelected ? 'rgba(0, 0, 0, 0.50)' : 'rgba(0, 0, 0, 0.35)',
                  border: isSelected ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(15px) saturate(110%)',
                  WebkitBackdropFilter: 'blur(15px) saturate(110%)',
                  boxShadow: isSelected ? '0 10px 30px rgba(0, 0, 0, 0.5)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: draggingNodeId === node.id ? 'grabbing' : 'pointer',
                  zIndex: isSelected ? 20 : 10,
                  transition: draggingNodeId === node.id ? 'none' : 'transform 0.15s ease, background 0.15s ease, border-color 0.15s ease',
                  padding: '12px'
                }}
                onMouseEnter={(e) => {
                  if (draggingNodeId !== node.id) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.background = isSelected ? 'rgba(0, 0, 0, 0.55)' : 'rgba(0, 0, 0, 0.45)';
                    e.currentTarget.style.borderColor = isSelected ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (draggingNodeId !== node.id) {
                    e.currentTarget.style.transform = 'translateY(0px)';
                    e.currentTarget.style.background = isSelected ? 'rgba(0, 0, 0, 0.50)' : 'rgba(0, 0, 0, 0.35)';
                    e.currentTarget.style.borderColor = isSelected ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)';
                  }
                }}
              >
                {/* Node Icon */}
                <div style={{ marginBottom: '6px' }}>
                  {theme.icon(theme.color)}
                </div>

                {/* Node Title (e.g. Me, Father, Mother) */}
                <div style={{
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  letterSpacing: '0.01em',
                  textAlign: 'center'
                }}>
                  {node.title}
                </div>

                {/* Subtitle / Name */}
                {node.subtitle && node.subtitle !== node.title && (
                  <div style={{
                    fontSize: '0.74rem',
                    color: '#94A3B8',
                    marginTop: '1px',
                    textAlign: 'center',
                    maxWidth: '130px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {node.subtitle}
                  </div>
                )}

                {/* Mini Condition or Status Pill */}
                {hasConditions ? (
                  <div style={{
                    marginTop: '4px',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    color: '#F59E0B',
                    background: 'rgba(245, 158, 11, 0.15)',
                    padding: '1px 7px',
                    borderRadius: '8px',
                    border: '1px solid rgba(245, 158, 11, 0.3)'
                  }}>
                    {node.conditions[0]}
                    {node.conditions.length > 1 ? ` +${node.conditions.length - 1}` : ''}
                  </div>
                ) : (
                  <div style={{
                    marginTop: '4px',
                    fontSize: '0.65rem',
                    color: '#64748B'
                  }}>
                    {node.isMe ? 'Primary Patient' : 'No conditions recorded'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* NODE DETAILS SLIDE-OUT DRAWER */}
      {isDrawerOpen && selectedNode && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '380px',
            maxWidth: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.50)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.6)',
            zIndex: 40,
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideInRight 0.2s ease-out'
          }}
        >
          {/* Drawer Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: `1.5px solid ${getNodeTheme(selectedNode.person_id, selectedNode).color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {getNodeTheme(selectedNode.person_id, selectedNode).icon(getNodeTheme(selectedNode.person_id, selectedNode).color)}
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC' }}>
                  {selectedNode.relationship || selectedNode.name}
                </h3>
                <span style={{ fontSize: '0.78rem', color: isMaleRelative(selectedNode) ? '#60A5FA' : '#F472B6' }}>
                  {selectedNode.is_self 
                    ? 'Target Patient (Center)' 
                    : isMaleRelative(selectedNode) ? '♂ Upper Tier (Male Lineage)' : '♀ Lower Tier (Female Lineage)'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsDrawerOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Drawer Body */}
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
            {selectedNode.is_self ? (
              <div>
                <div style={{ 
                  background: 'rgba(56, 189, 248, 0.08)', 
                  border: '1px solid rgba(56, 189, 248, 0.25)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '14px',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#38BDF8', marginBottom: '4px' }}>
                    Primary Patient Profile (Me)
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#94A3B8', lineHeight: 1.5 }}>
                    To modify your baseline biometrics, blood pressure, or laboratory tests, click below to return to My Health Data.
                  </div>
                  <button
                    className="btn btn-outline"
                    onClick={onBackToInput}
                    style={{ marginTop: '12px', width: '100%', fontSize: '0.85rem', borderColor: '#38BDF8', color: '#38BDF8' }}
                  >
                    <Edit2 size={14} />
                    <span>Edit Personal Health Inputs</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1E293B', fontSize: '0.88rem' }}>
                    <span style={{ color: '#94A3B8' }}>Age:</span>
                    <span style={{ fontWeight: 600, color: '#F8FAFC' }}>{selfData.age || '—'} years</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1E293B', fontSize: '0.88rem' }}>
                    <span style={{ color: '#94A3B8' }}>Sex:</span>
                    <span style={{ fontWeight: 600, color: '#F8FAFC', textTransform: 'capitalize' }}>{selfData.gender || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1E293B', fontSize: '0.88rem' }}>
                    <span style={{ color: '#94A3B8' }}>Height & Weight:</span>
                    <span style={{ fontWeight: 600, color: '#F8FAFC' }}>{selfData.height || '—'} cm / {selfData.weight || '—'} kg</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1E293B', fontSize: '0.88rem' }}>
                    <span style={{ color: '#94A3B8' }}>Blood Pressure:</span>
                    <span style={{ fontWeight: 600, color: '#F8FAFC' }}>
                      {selfData.blood_pressure?.sys_bp && selfData.blood_pressure?.dia_bp 
                        ? `${selfData.blood_pressure.sys_bp}/${selfData.blood_pressure.dia_bp} mmHg` 
                        : 'Not provided'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="form-group">
                  <label className="form-label">Relative Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={selectedNode.name || ''}
                    onChange={(e) => handleUpdateMember({ ...selectedNode, name: e.target.value })}
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Age</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Optional"
                      value={selectedNode.age || ''}
                      onChange={(e) => handleUpdateMember({ ...selectedNode, age: e.target.value === '' ? null : parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Biological Sex</label>
                    <select
                      className="form-control"
                      style={{ backgroundColor: '#0A0A0A', color: '#FFFFFF', colorScheme: 'dark' }}
                      value={selectedNode.sex || 'Male'}
                      onChange={(e) => handleUpdateMember({ ...selectedNode, sex: e.target.value })}
                    >
                      <option value="Male" style={{ backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>Male (Upper Tier)</option>
                      <option value="Female" style={{ backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>Female (Lower Tier)</option>
                    </select>
                  </div>
                </div>

                {/* Section 1, 2, 13: COMPACT 3-STATE FAMILY CONDITIONS PANEL */}
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>
                      Known Medical Conditions
                    </label>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                      YES (1) &bull; NO (0) &bull; UNKNOWN (null)
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {CORE_FAMILY_CONDITIONS.map((cond) => {
                      const famConditions = selectedNode.family_conditions || {};
                      let val = famConditions[cond.key];
                      if (val === undefined) {
                        if (selectedNode.history_unknown) {
                          val = null;
                        } else if ((selectedNode.conditions || []).some((c) => c.toLowerCase().includes(cond.key) || c.toLowerCase().includes(cond.label.toLowerCase()))) {
                          val = 1;
                        } else {
                          val = null;
                        }
                      }

                      const ageDiagMap = selectedNode.age_at_diagnosis || {};
                      const ageVal = ageDiagMap[cond.key] != null ? ageDiagMap[cond.key] : '';

                      const handleSetState = (newVal) => {
                        const updatedFamConditions = {
                          ...famConditions,
                          [cond.key]: newVal
                        };
                        const activeConditions = CORE_FAMILY_CONDITIONS
                          .filter((c) => updatedFamConditions[c.key] === 1)
                          .map((c) => c.label);

                        handleUpdateMember({
                          ...selectedNode,
                          family_conditions: updatedFamConditions,
                          conditions: activeConditions
                        });
                      };

                      const handleSetAge = (newAge) => {
                        const updatedAges = {
                          ...ageDiagMap,
                          [cond.key]: newAge ? parseInt(newAge, 10) || newAge : null
                        };
                        handleUpdateMember({
                          ...selectedNode,
                          age_at_diagnosis: updatedAges
                        });
                      };

                      return (
                        <div
                          key={cond.key}
                          style={{
                            background: 'var(--bg-input)',
                            border: val === 1 ? '1px solid rgba(16, 185, 129, 0.45)' : (val === 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #243044'),
                            borderRadius: '8px',
                            padding: '9px 12px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#F8FAFC' }}>
                              {cond.label}
                            </span>

                            {/* 3-State Segmented Buttons */}
                            <div style={{
                              display: 'flex',
                              background: 'rgba(0, 0, 0, 0.35)',
                              backdropFilter: 'blur(12px)',
                              WebkitBackdropFilter: 'blur(12px)',
                              borderRadius: '6px',
                              padding: '2px',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              gap: '2px'
                            }}>
                              <button
                                type="button"
                                onClick={() => handleSetState(1)}
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  border: 'none',
                                  background: val === 1 ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                                  color: val === 1 ? '#34D399' : '#64748B',
                                  boxShadow: val === 1 ? '0 0 6px rgba(16, 185, 129, 0.3)' : 'none'
                                }}
                              >
                                YES
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetState(0)}
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  border: 'none',
                                  background: val === 0 ? 'rgba(239, 68, 68, 0.22)' : 'transparent',
                                  color: val === 0 ? '#F87171' : '#64748B',
                                  boxShadow: val === 0 ? '0 0 6px rgba(239, 68, 68, 0.3)' : 'none'
                                }}
                              >
                                NO
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetState(null)}
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  border: 'none',
                                  background: val === null ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                                  color: val === null ? '#FBBF24' : '#64748B',
                                  boxShadow: val === null ? '0 0 6px rgba(245, 158, 11, 0.3)' : 'none'
                                }}
                              >
                                UNKNOWN
                              </button>
                            </div>
                          </div>

                          {/* Optional Age at diagnosis when YES */}
                          {val === 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #1E293B' }}>
                              <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>Age at diagnosis (optional):</span>
                              <input
                                type="number"
                                min="1"
                                max="120"
                                placeholder="e.g. 52"
                                value={ageVal}
                                onChange={(e) => handleSetAge(e.target.value)}
                                style={{
                                  width: '68px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  background: 'rgba(0, 0, 0, 0.25)',
                                  backdropFilter: 'blur(12px)',
                                  WebkitBackdropFilter: 'blur(12px)',
                                  color: '#F8FAFC',
                                  fontSize: '0.78rem'
                                }}
                              />
                              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>years</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Upload Report for this Relative */}
                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #243044' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={onOpenReportUpload}
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  >
                    <FileText size={15} />
                    <span>Upload Lab Report for {selectedNode.name}</span>
                  </button>
                </div>

                {/* Delete Member Option */}
                <div style={{ marginTop: '16px' }}>
                  <button
                    onClick={() => handleDeleteMember(selectedNode.person_id)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: 'var(--radius-md)',
                      color: '#EF4444',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Remove Relative Node</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD MEMBER MODAL */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.50)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="card"
            style={{ width: '490px', maxWidth: '100%', background: 'rgba(0, 0, 0, 0.55)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
                  <Plus size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#FFFFFF' }}>Add Biological Relative</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Expand your pedigree tree for genetic evaluation</div>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#888888', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Visual Lineage Placement Indicator */}
            <div style={{
              marginBottom: '18px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                Node Placement Target:
              </div>
              <div style={{
                fontSize: '0.76rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                letterSpacing: '0.02em'
              }}>
                {isNewMemberMale ? '♂ Upper Tier (Male)' : '♀ Lower Tier (Female)'}
              </div>
            </div>

            <form onSubmit={handleAddMemberSubmit}>
              <div className="form-group">
                <label className="form-label">Relationship to Me</label>
                <select
                  className="form-control"
                  style={{ backgroundColor: '#0A0A0A', color: '#FFFFFF', colorScheme: 'dark' }}
                  value={newMemberForm.relationship}
                  onChange={(e) => {
                    const rel = e.target.value;
                    let defSex = 'Female';
                    if (['Father', 'Brother', 'Paternal Grandfather', 'Maternal Grandfather', 'Son', 'Uncle'].includes(rel)) {
                      defSex = 'Male';
                    }
                    setNewMemberForm((prev) => ({
                      ...prev,
                      relationship: rel,
                      sex: defSex
                    }));
                  }}
                >
                  <option value="Father" style={{ backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>Father &rarr; Upper Tier (Male ♂)</option>
                  <option value="Mother" style={{ backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>Mother &rarr; Lower Tier (Female ♀)</option>
                  <option value="Brother" style={{ backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>Brother &rarr; Upper Tier (Male ♂)</option>
                  <option value="Sister" style={{ backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>Sister &rarr; Lower Tier (Female ♀)</option>
                  <option value="Paternal Grandfather" style={{ backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>Paternal Grandfather &rarr; Upper Tier (Male ♂)</option>
                  <option value="Paternal Grandmother" style={{ backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>Paternal Grandmother &rarr; Lower Tier (Female ♀)</option>
                  <option value="Maternal Grandfather" style={{ backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>Maternal Grandfather &rarr; Upper Tier (Male ♂)</option>
                  <option value="Maternal Grandmother" style={{ backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>Maternal Grandmother &rarr; Lower Tier (Female ♀)</option>
                  <option value="Son" style={{ backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>Son &rarr; Upper Tier (Male ♂)</option>
                  <option value="Daughter" style={{ backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>Daughter &rarr; Lower Tier (Female ♀)</option>
                  <option value="Uncle" style={{ backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>Uncle (Blood) &rarr; Upper Tier (Male ♂)</option>
                  <option value="Aunt" style={{ backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>Aunt (Blood) &rarr; Lower Tier (Female ♀)</option>
                </select>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Name / Nickname (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Sarah"
                    value={newMemberForm.name}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Biological Sex</label>
                  <select
                    className="form-control"
                    style={{ backgroundColor: '#0A0A0A', color: '#FFFFFF', colorScheme: 'dark' }}
                    value={newMemberForm.sex}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, sex: e.target.value })}
                  >
                    <option value="Male" style={{ backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>Male &rarr; Upper Node ♂</option>
                    <option value="Female" style={{ backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>Female &rarr; Lower Node ♀</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Age (Optional)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 48"
                  value={newMemberForm.age}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, age: e.target.value })}
                />
              </div>

              {/* Known Conditions: Default strictly UNKNOWN (null) */}
              <div style={{ marginTop: '16px', marginBottom: '8px' }}>
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '8px', display: 'block' }}>
                  Known Conditions (Default: UNKNOWN)
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {CORE_FAMILY_CONDITIONS.map((cond) => {
                    const val = newMemberForm.family_conditions[cond.key];
                    return (
                      <div
                        key={cond.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(15, 23, 42, 0.6)',
                          border: val === 1 ? '1px solid rgba(16, 185, 129, 0.45)' : (val === 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #1E293B'),
                          borderRadius: '8px',
                          padding: '6px 12px'
                        }}
                      >
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#F1F5F9' }}>
                          {cond.label}
                        </span>

                        <div style={{
                          display: 'flex',
                          background: 'rgba(0, 0, 0, 0.35)',
                          backdropFilter: 'blur(12px)',
                          WebkitBackdropFilter: 'blur(12px)',
                          borderRadius: '6px',
                          padding: '2px',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          gap: '2px'
                        }}>
                          <button
                            type="button"
                            onClick={() => setNewMemberForm((prev) => ({
                              ...prev,
                              family_conditions: { ...prev.family_conditions, [cond.key]: 1 }
                            }))}
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: 'none',
                              background: val === 1 ? 'rgba(16, 185, 129, 0.3)' : 'transparent',
                              color: val === 1 ? '#34D399' : '#64748B'
                            }}
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewMemberForm((prev) => ({
                              ...prev,
                              family_conditions: { ...prev.family_conditions, [cond.key]: 0 }
                            }))}
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: 'none',
                              background: val === 0 ? 'rgba(239, 68, 68, 0.3)' : 'transparent',
                              color: val === 0 ? '#F87171' : '#64748B'
                            }}
                          >
                            NO
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewMemberForm((prev) => ({
                              ...prev,
                              family_conditions: { ...prev.family_conditions, [cond.key]: null }
                            }))}
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: 'none',
                              background: val === null ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                              color: val === null ? '#FBBF24' : '#64748B'
                            }}
                          >
                            UNKNOWN
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#FFFFFF', color: '#000000', border: 'none', fontWeight: 600 }}
                >
                  {isNewMemberMale ? 'Add to Upper Tier ♂' : 'Add to Lower Tier ♀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
